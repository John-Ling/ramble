from fastapi import Body, Depends, FastAPI, HTTPException, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from transformers import pipeline, AutoTokenizer

from dotenv import load_dotenv
import httpx
import os
import uvicorn
import redis
import uuid
import logging

import emotional_analytics
from _types import *

load_dotenv()

ANALYTICS_MODEL_NAME="monologg/bert-base-cased-goemotions-original"
MONGODB_URI = os.getenv("MONGODB_URI")
SECRET = os.getenv("AUTH_SECRET") # Same as NEXTAUTH_SECRET. Used for decrypting JWT
_REDIS_PORT = os.getenv("REDIS_PORT")
if _REDIS_PORT is not None:
    REDIS_PORT = int(_REDIS_PORT)
else:
    REDIS_PORT = 6379

ENVIRONMENT = os.getenv("ENVIRONMENT")

db = None
redisStore: redis.Redis | None = None # startup redis using docker
oauth2Scheme = OAuth2PasswordBearer(tokenUrl="token")
bearerScheme = HTTPBearer()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
classifier = None
tokeniser = None

userCollection: AsyncIOMotorCollection | None = None
entryCollection: AsyncIOMotorCollection | None = None
emotionCollection: AsyncIOMotorCollection | None = None
collection:  AsyncIOMotorCollection | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, userCollection, entryCollection, emotionCollection, redisStore, classifier, tokeniser
    try:
        # Startup code
        logger.info("Connecting to MongoDB")
        client = AsyncIOMotorClient(MONGODB_URI)
        logger.info("Connecting to Redis")
        redisStore = redis.Redis(host="redis", port=REDIS_PORT, decode_responses=True)

        logger.info("Getting collections")
        db = client[ENVIRONMENT]

        userCollection = db.get_collection("users")
        entryCollection = db.get_collection("entries")
        emotionCollection = db.get_collection("emotion-data")

        logger.info("Initialising classifier and tokeniser")
        classifier = pipeline(task="text-classification", model=ANALYTICS_MODEL_NAME, top_k=None)
        tokeniser = AutoTokenizer.from_pretrained(ANALYTICS_MODEL_NAME)

        if entryCollection is None:
            raise ValueError
        # Create indexes for composite keys on entries
        # await entryCollection.create_index([("authorID", ASCENDING), ("created", ASCENDING)], unique=True)
    except Exception as e:
        logger.error(e)
    yield
    # Shutdown code
    if db is not None:
        db.client.close()
        logger.info("Disconnected from DB")

app = FastAPI(
    title="Ramble Middleware",
    description="wagwan",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/walao")
async def delete_all():
    await emotionCollection.delete_many({})
    await userCollection.delete_many({})
    await entryCollection.delete_many({})
    return {"Done": "walao"}

# probably refactor into a decorator
async def check_auth(uid: str, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if redisStore is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis is not running"
        )
    
    accessToken = credentials.credentials
    logger.info(accessToken)
    logger.info(redisStore.get(uid))

    if redisStore.get(uid) == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist"
        )
    
    if redisStore.get(uid) != accessToken:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorised"
        ) 
    return

@app.post("/api/auth/set-access-token/", status_code=status.HTTP_201_CREATED)
async def set_access_token(accessToken: AccessToken, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if redisStore is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis is not running"
        )
    
    sub = accessToken.sub 
    token = accessToken.token
    

    adminSecret = credentials.credentials
    if adminSecret != os.getenv("ADMIN_SECRET"):
        logger.info("Attempt to set access token denied")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Nice try dumbass"
        )

    logger.info("Setting access token")
    prev = redisStore.get(sub)
    redisStore.set(sub, token)

    logger.info(f"Changed access token {prev} for UID {sub} to {redisStore.get(sub)}")

    return {"message": "Added token"}

@app.post("/api/entries/{uid}/", status_code=status.HTTP_201_CREATED)
async def create_entry_reference_and_insert_entry(uid: str, entry: JournalEntryReqBody = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    """
    Takes the schema for a journal entry and creates both a reference and entry
    The reference is inserted into the user's entries
    The entry is inserted into the entries collection
    """

    if userCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User collection is Null"
        )
    
    await check_auth(uid, credentials)
    
    user = await userCollection.find_one({"_id": uid})
    body = entry.model_dump(by_alias=True)

    if (body["createdOn"] == "" or body["_id"] == "" or body["authorID"] == ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed request"
        )
    
    # Insert entry reference
    entryReference: JournalEntryReference = JournalEntryReference() 

    generatedID = str(uuid.uuid4())
    entryReference.id = generatedID + body["authorID"]
    entryReference.createdOn = body["createdOn"]
    entryReference.name = body["name"]

    entryReferenceDict = entryReference.model_dump(by_alias=True)

    # update user collection
    if user is None:
        # create new user
        newUser = {
            "_id": uid,
            "entries": [entryReferenceDict]
        }
        await userCollection.insert_one(newUser)
    else:
        # entries are stored in a stack where the most recent is at the front
        await userCollection.update_one({"_id": uid}, 
                                            {"$push": {
                                                "entries": {
                                                    "$each": [entryReferenceDict],
                                                    "$position": 0
                                                    }
                                                }
                                            }
                                        )
    
        

    insertEntry: JournalEntry = JournalEntry()
    insertEntry.id = generatedID + body["authorID"]
    insertEntry.content = body["content"]

    # Insert actual entry into database
    # update entry collection
    if await _insert_entry(insertEntry, body["createdOn"], body["authorID"]) is not None:
        return {"message": "Everything done :)"}

    # roll back change if there is an error
    logger.error("walao rolling back")
    # Rollback transaction and remove entry reference
    if user is not None:
        await userCollection.update_one({"_id": uid}, {"$pop": {"entries": -1}})
    else:
        await userCollection.find_one_and_delete({"_id": uid})
    
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="walao something go wrong undoing change"
    )

async def _insert_entry(entry: JournalEntry, dbDate: str, authorID: str):
    """
    Insert a journal entry into the entries collection
    """
    if entryCollection is None:
        return None

    if emotionCollection is None:
        return None

    entryDict = entry.model_dump(by_alias=True)    

    logger.info("INSERTING INTO TABLE")
    logger.info(entryDict["_id"])
    existingEntry = await entryCollection.find_one({"_id": entryDict["_id"]})

    if existingEntry is not None:
        logger.info("ENTRY ALREADY EXISTS")
        return None

    logger.info("PROCESSING EMOTIONS")
    # do emotion processing here
    chunks = emotional_analytics.generate_chunks(entryDict["content"], tokeniser)
    scores = emotional_analytics.calculate_emotion_scores(chunks, classifier)

    emotionData: JournalEntryEmotionData = _create_emotion_data(scores, authorID, dbDate, entryDict["_id"])
    emotionDataDict = emotionData.model_dump(by_alias=True)
    logger.info(emotionDataDict)

    await emotionCollection.insert_one(emotionDataDict)    
    await entryCollection.insert_one(entryDict)
    return { "message": "Wrote document" }

def _create_emotion_data(scores, authorID, dbDate, entryID):
    logger.info("SCORES")
    logger.info(scores)
    logger.info(entryID)

    emotionFields = [
        'admiration', 'amusement', 'anger', 'annoyance', 'approval',
        'caring', 'confusion', 'curiosity', 'desire', 'disappointment',
        'disapproval', 'embarrassment', 'disgust', 'fear', 'gratitude',
        'joy', 'excitement', 'neutral', 'love', 'optimism',
        'pride', 'realization', 'relief', 'remorse', 'nervousness',
        'surprise', 'sadness', 'grief'
    ]

    emotions = {}
    for emotion in emotionFields:
        emotions[emotion] = scores[emotion]

    emotionData = JournalEntryEmotionData(
        _id=entryID,
        authorID=authorID,
        created=dbDate,
        **emotions
    )

    logger.info(emotionData.id)
    return emotionData


async def get_entries_before(uid: str, dbDate: str, fetchCount: int = 12):
    logger.info(dbDate)
    pipeline = [
        {"$match": {"_id": uid}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            "$addFields": {
                "entries._dateCreated": {
                    "$dateFromString": {
                        "dateString": "$entries.createdOn"
                    }
                }
            }
        },
        {"$sort": {"entries._dateCreated": 1}},    
        {
            "$addFields": {
                "entries._beforeTarget": {
                    "$lte": ["$entries._dateCreated", {
                        "$dateFromString": { "dateString": dbDate }
                    }]
                }
            }
        },
        {
            "$match": {
                "entries._beforeTarget": True
            }
        },
        {"$sort": {"entries._dateCreated": -1}},
        {"$limit": fetchCount + 1},  
        {
            "$group": {
                "_id": "$_id",
                "entries": {"$push": "$entries"},
                "entryCount": {"$sum": 1}
            }
        } 
    ]

    if userCollection is None:
        return (None, None)

    result = await userCollection.aggregate(pipeline).to_list(1)
    if not result:
        return (None, None)

    return ( result[0].get("entries", [JournalEntryReference]), result[0].get("entryCount", int) )

@app.get("/api/entries/{uid}/{dbDate}/{fetchCount}/", status_code=status.HTTP_200_OK)
async def get_entry_references(uid: str, dbDate: str, fetchCount: int = 12):
    """
    Given a specific db date try and get fetchCount entries before it including itself
    """
    
    if userCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User collection is Null"
        )

    try:
        # try getting the first entry with specific dbDate
        logger.info("Getting first entry");
        logger.info(dbDate);

        entries = []


        # check if the most recent entry matches the dbDate
        
        # handle edge case where documents are uploaded
        # and as such are 
        entry = await userCollection.aggregate([
            {"$match": {"_id": uid}},
            {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
            {
                "$match": {
                    "entries.name": dbDate
                }
            },
            {"$limit": 1}
        ]).to_list(1)

        logger.info(entry)

        if entry == []:
            # create dummy entry
            logger.info("No entry found")
            entries = [{"_id": dbDate, "createdOn": dbDate, "name": dbDate, "favourite": False}]        

        logger.info(entries)
        (entriesBefore, count) = await get_entries_before(uid, dbDate, fetchCount=fetchCount)
        if not entriesBefore or not count:
            return {"entries": entries, "finalEntry": None, "entryCount": 1, "areDocumentsLeft": False}

        for entry in entriesBefore:
            entries.append(entry)

        logger.info("ALL ENTRIES ", entries)
    
        count = count
        finalEntry = None
        areDocumentsLeft = True

        if (count != fetchCount + 1):
            # If less than fetchCount documents have been pulled then we have run out
            areDocumentsLeft = False
        else: 
            # remove final entry and keep track of it 
            finalEntry = entries.pop()
            logger.info(finalEntry)
            logger.info(finalEntry["createdOn"])
            if finalEntry and finalEntry["createdOn"]:
                (entriesLeft, _) = await get_entries_before(uid, finalEntry["createdOn"], fetchCount=1)
                if entriesLeft:
                    areDocumentsLeft = True
        
        return {"entries": entries, "finalEntry": finalEntry, "entryCount": max(0, count - 1), "areDocumentsLeft": areDocumentsLeft}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {e}"
        )

async def _get_entry(entryUUID: str):
    if entryCollection is None:
        return None
    entry = await entryCollection.find_one({"_id": entryUUID})
    if entry is not None:
        return entry

    return None

@app.get("/api/entries/{uid}/{entryName}/", status_code=status.HTTP_200_OK)
async def get_entry(uid: str, entryName: str, response: Response, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    """
    Given a entry name (assumed to be unique) return an entry
    Returns 200 if entry exists and 204 if it does not
    """

    if userCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User collection is Null"
        )

    await check_auth(uid, credentials)

    # get uuid for entry
    # entryReference: JournalEntryReference = await _get_entry(uid, dbDate)
    # try get most recent entry with specific entry name
    foundEntry = await userCollection.aggregate([
        {"$match": {"_id": uid}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            "$match": {
                "entries.name": entryName
            }
        },
        {"$limit": 1}
    ]).to_list(1)

    if foundEntry == []:
        response.status_code = status.HTTP_404_NOT_FOUND
        return None

    logger.info(foundEntry)
    
    entryUUID = str(foundEntry[0]["entries"]["_id"])
    logger.info(entryUUID)

    # # search db for content using uuid 
    entry = await _get_entry(entryUUID)
    if entry is not None:
        return JSONResponse(content=entry)

    response.status_code = status.HTTP_404_NOT_FOUND
    return None

@app.put("/api/entries/{uid}/{entryName}/", status_code=status.HTTP_200_OK)
async def update_entry(uid: str, entryName: str, updated: UpdateJournalEntry = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if entryCollection is None or userCollection is None or emotionCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entry or User collection is Null"
        )

    await check_auth(uid, credentials)

    logger.info("UPDATING ENTRY")

    updateEntry = {
        k: v for k, v in updated.model_dump(by_alias=True).items() if v is not None
    }

    if len(updateEntry) >= 1:
        # at least one field needs to be updated
        # update entries collection

        # get uuid to update
        foundEntry = await userCollection.aggregate([
            {"$match": {"_id": uid}},
            {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
            {
                "$match": {
                    "entries.name": entryName
                }
            },
            {"$limit": 1}
        ]).to_list(1)

        if foundEntry == []:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not  find entry"
            )
    
        entryUUID = str(foundEntry[0]["entries"]["_id"])        
        authorID = str(foundEntry[0]["entries"]["authorID"])
        dbDate = str(foundEntry[0]["entries"]["dbDate"])

        # update emotion scores 
        logger.info("UPDATING EMOTIONS")

        chunks = emotional_analytics.generate_chunks(updateEntry["content"], tokeniser)
        scores = emotional_analytics.calculate_emotion_scores(chunks, classifier)
        emotionData = _create_emotion_data(scores, authorID, dbDate, entryUUID)
        updateEmotionRes = await emotionCollection.find_one_and_replace({"_id": entryUUID}, {"$set": emotionData.model_dump(by_alias=True)})
        updateEntryRes = await entryCollection.find_one_and_update({"_id": entryUUID}, {"$set": updateEntry})
        if updateEntryRes is not None and updateEmotionRes is not None:
            return { "message": "yippie"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document does not exist"
        )

@app.post("/api/entries/{uid}/upload/", status_code=status.HTTP_201_CREATED)
async def upload_entry(uid: str, entry: JournalEntryReqBody = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    await check_auth(uid, credentials)

    body = entry.model_dump(by_alias=True)
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"http://localhost:8000/api/entries/{uid}/", json=body, 
                                        headers={"Authorization": f"Bearer {credentials.credentials}", "Content-Type": "application/json"})
            response.raise_for_status()
            return {"message": "Uploaded file"}
        except httpx.HTTPError as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Error occurred when uploading"
            )

    return {"status": "Done"}

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True )