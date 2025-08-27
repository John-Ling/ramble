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
import json
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
    global db, userCollection, entryCollection, redisStore, classifier, tokeniser
    
    try:
        # Startup code
        logger.info("Connecting to MongoDB")
        client = AsyncIOMotorClient(MONGODB_URI)
        logger.info("Connecting to Redis")
        redisStore = redis.Redis(host="redis", port=REDIS_PORT, decode_responses=True)

        logger.info("Getting collections")
        db = client["prod"]

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
        print(e)
    yield
    # Shutdown code
    if db is not None:
        db.client.close()
        print("Disconnected from DB")

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
async def reset():
    # pls pls pls remove this in production
    await entryCollection.delete_many({})
    await userCollection.delete_many({})
    return {"walao": "completed"}


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
    entryReference.id = body["_id"]
    entryReference.createdOn = body["createdOn"]
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
    insertEntry.id = body["_id"]
    insertEntry.content = body["content"]

    # Insert actual entry into database
    # update entry collection
    if await _insert_entry(insertEntry) is not None:
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

async def _insert_entry(entry: JournalEntry):
    """
    Insert a journal entry into the entries collection
    """
    if entryCollection is None:
        return None

    entryDict = entry.model_dump(by_alias=True)    

    logger.info("INSERTING INTO TABLE")
    logger.info(entryDict["_id"])
    existingEntry = await entryCollection.find_one({"_id": entryDict["_id"]})

    if existingEntry is not None:
        logger.info("ENTRY ALREADY EXISTS")
        return None

    # do emotion processing here
    chunks = emotional_analytics.generate_chunks(entryDict["content"], tokeniser)
    scores = emotional_analytics.calculate_emotion_scores(chunks, classifier)
    logger.info(scores);

    logger.info("PROCESSING EMOTIONS")
    
    await entryCollection.insert_one(entryDict)
    return { "message": "Wrote document" }

async def get_entries_before(uid: str, dbDate: str, fetchCount: int = 12):
    pipeline = [
        {"$match": {"_id": uid}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            "$addFields": {
                "entries._dateCreated": {
                    "$dateFromString": { "dateString": "$entries._id" }
                }
            }
        },
        {"$sort": {"entries._dateCreated": 1}},    
        {
            "$addFields": {
                "entries._beforeTarget": {
                    "$lt": ["$entries._dateCreated", {
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
    if userCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="User collection is Null"
        )

    try:
        firstEntry = await _get_entry(uid, dbDate)
        print(firstEntry)

        if firstEntry is None:
            # create dummy entry
            firstEntry = JournalEntryReference(_id=dbDate, created=dbDate, name="", favourite=False).model_dump(by_alias=True)
            logger.debug(firstEntry)
        entries = [firstEntry]
    
        (entriesBefore, count) = await get_entries_before(uid, dbDate, fetchCount=fetchCount)

        if not entriesBefore or not count:
            return {"entries": entries, "finalEntry": None, "entryCount": 1, "areDocumentsLeft": False}

        for entry in entriesBefore:
            entries.append(entry)
    
        count = count
        finalEntry = None
        areDocumentsLeft = True

        if (count != fetchCount + 1):
            # If less than fetchCount documents have been pulled then we have run out
            areDocumentsLeft = False
        else: 
            # remove final entry and keep track of it 
            finalEntry = entries.pop()
            print(finalEntry)
            print(finalEntry["_id"])
            if finalEntry and finalEntry["_id"]:
                (entriesLeft, _) = await get_entries_before(uid, finalEntry["_id"], fetchCount=1)
                if entriesLeft:
                    areDocumentsLeft = True
        
        return {"entries": entries, "finalEntry": finalEntry, "entryCount": max(0, count - 1), "areDocumentsLeft": areDocumentsLeft}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {e}"
        )

async def _get_entry(uid: str, dbDate: str):
    if entryCollection is None:
        return None

    entry = await entryCollection.find_one({"authorID": uid, "created": dbDate})
    if entry is not None:
        return entry

    return None

@app.get("/api/entries/{uid}/{dbDate}/", status_code=status.HTTP_200_OK)
async def get_entry(uid: str, dbDate: str, response: Response, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    """
    Returns a journal entry for a specific user and dbDate
    Returns 200 if entry exists and 204 if it does not
    """

    if entryCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entry collection is Null"
        )

    await check_auth(uid, credentials)

    # get uuid for entry
    entryReference: JournalEntryReference = await _get_entry(uid, dbDate)
    uuid = entryReference.id

    # search db for content using uuid

    # await 
 
    entry = await _get_entry(uid, dbDate)
    if entry is not None:
        return JSONResponse(content=entry)

    response.status_code = status.HTTP_404_NOT_FOUND
    return None

@app.put("/api/entries/{uid}/{dbDate}/", status_code=status.HTTP_200_OK)
async def update_entry(uid: str, dbDate: str, updated: UpdateJournalEntry = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if entryCollection is None or userCollection is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Entry or User collection is Null"
        )

    await check_auth(uid, credentials)

    writeEntry = {
        k: v for k, v in updated.model_dump(by_alias=True).items() if v is not None
    }

    if len(writeEntry) >= 1:
        # at least one field needs to be updated
        # update entries collection

        # add code for processing emotions here
        logger.info("PROCESSING EMOTIONS")

        chunks = emotional_analytics.generate_chunks(writeEntry["content"], tokeniser)
        scores = emotional_analytics.calculate_emotion_scores(chunks, classifier)
        logger.info(scores);

        updateResult = await entryCollection.find_one_and_update({"authorID": uid, "created": dbDate}, {"$set": writeEntry})
        if updateResult is not None:
            return { "message": "yippie"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document does not exist"
        )

@app.post("/api/entries/{uid}/upload/", status_code=status.HTTP_201_CREATED)
async def upload_entry(uid: str, entry: JournalEntry = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    await check_auth(uid, credentials)

    body = entry.model_dump(by_alias=True)

    # create a journal entry 
    entry = JournalEntry()
    entry.content = body["content"]
    entry.id = entry["_id"]

    entryDict = entry.model_dump(by_alias=True)

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(f"http://localhost:8000/api/entries/{uid}/", json=entryDict, 
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