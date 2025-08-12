from fastapi import Body, Depends, FastAPI, HTTPException, Response, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from dotenv import load_dotenv
import httpx
import os
import uvicorn
import redis
import json
import logging

from _types import *

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI")
SECRET = os.getenv("AUTH_SECRET") # Same as NEXTAUTH_SECRET. Used for decrypting JWT
ALGORITHM=os.getenv("AUTH_ALGORITHM")
REDIS_URI = os.getenv("REDIS_URI")
REDIS_PORT = os.getenv("REDIS_PORT")
if REDIS_PORT is not None:
    REDIS_PORT = int(REDIS_PORT)
else:
    REDIS_PORT = 8002

db = None
accessTokens: redis.Redis | None = None # startup redis using docker
oauth2Scheme = OAuth2PasswordBearer(tokenUrl="token")
bearerScheme = HTTPBearer()
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

userCollection: AsyncIOMotorCollection | None = None
entryCollection: AsyncIOMotorCollection | None = None
collection:  AsyncIOMotorCollection | None = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global db, userCollection, entryCollection, accessTokens
    
    try:
        # Startup code
        client = AsyncIOMotorClient(MONGODB_URI)
        accessTokens = redis.Redis(host="172.17.0.1", port=8002, decode_responses=True)
        db = client["prod"]
        userCollection = db.get_collection("users")
        entryCollection = db.get_collection("entries")

        # Create indexes for composite keys on entries
        await entryCollection.create_index([("authorID", ASCENDING), ("created", ASCENDING)], unique=True)
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

# probably refactor into a decorator
async def check_auth(uid: str, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if accessTokens is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Redis is not running"
        )
    
    accessToken = credentials.credentials
    # logger.info(accessToken)
    # logger.info(accessTokens.get(uid))

    if accessTokens.get(uid) == None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User does not exist"
        )
    
    if accessTokens.get(uid) != accessToken:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="You are not authorised"
        ) 
    return

@app.post("/api/auth/set-access-token/", status_code=status.HTTP_201_CREATED)
async def set_access_token(accessToken: AccessToken, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    if accessTokens is None:
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
    accessTokens.set(sub, token)
    return {"message": "Added token"}

@app.post("/api/users/create-entry/", status_code=status.HTTP_201_CREATED)
async def create_entry_reference_and_insert_entry(entry: JournalEntry = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
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
    
    uid = entry.authorID
    try:
        await check_auth(uid, credentials)
    except HTTPException as e:
        raise e
    
    user = await userCollection.find_one({"_id": uid})
    entryDict = entry.model_dump(by_alias=True)

    if (entryDict["created"] == "" or entryDict["_id"] == "" or entryDict["authorID"] == ""):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Malformed request"
        )
    
    # Insert entry reference
    entryReference: JournalEntryReference = JournalEntryReference() 
    entryReference.created = entryDict["created"]
    entryReferenceDict = entryReference.model_dump(by_alias=True)

    if user is not None:
        await userCollection.update_one({"_id": uid}, {"$push": {"entries": entryReferenceDict}})
    else:
        newUser = {
            "_id": uid,
            "entries": [entryReferenceDict]
        }
        await userCollection.insert_one(newUser)
    
    # Insert actual entry into database
    async with httpx.AsyncClient() as client:
        try:

            print("Making call")
            response = await client.post("http://localhost:8000/api/entries/insert-entry/", 
                                        json=entryDict, 
                                        headers={"Authorization": f"Bearer {credentials.credentials}", "Content-Type": "application/json"})
        
            print("Checking status")
            response.raise_for_status()
            return {"message": "Everything done :)"}
        except httpx.HTTPError as e:
            print("Rollback")
            print(e)
            # Rollback transaction and remove entry reference
            if user is not None:
                await userCollection.update_one({"_id": uid}, {"$pop": {"entries": 1}})
            else:
                await userCollection.find_one_and_delete({"_id": uid})
            
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="walao something go wrong undoing change"
            )

@app.post("/api/entries/insert-entry/", status_code=status.HTTP_201_CREATED)
async def insert_entry(response: Response, entry: dict = Body(...), credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
    """
    Insert a journal entry into the entries collection
    """
    if entryCollection is None:
        response.status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        raise httpx.HTTPError(
            message="Entry collection is Null"
        )
    
    if (entry["created"] == "" or entry["_id"] == "" or entry["authorID"] == ""):
        response.status_code = status.HTTP_400_BAD_REQUEST
        raise httpx.HTTPError(
            message="Malformed request"
        )

    await check_auth(entry["authorID"], credentials)

    existingEntry = await entryCollection.find_one({"authorID": entry["authorID"], "created": entry["created"]})
    if existingEntry is not None:
        response.status_code = status.HTTP_409_CONFLICT
        raise httpx.HTTPError(
            message="Entry already exists"
        )

    await entryCollection.insert_one(entry)
    return { "message": "Wrote document" }



async def get_entries_before(uid: str, dbDate: str, fetchCount: int = 12):
    pipeline = [
        {"$match": {"_id": uid}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            # Convert entries created attribute into valid dates for comparisons
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
        (entries, count) = await get_entries_before(uid, dbDate, fetchCount=fetchCount)

        if not entries or not count:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="User does not exist or no entries found"
            )

        finalEntry: JournalEntryReference | None = None
        areDocumentsLeft = True

        if (count != fetchCount + 1):
            # If less than fetchCount documents have been pulled then we have run out
            areDocumentsLeft = False
        else: 
            # remove final entry and keep track of it 
            finalEntry = entries.pop()
            if finalEntry and finalEntry.created:
                (entriesLeft, _) = await get_entries_before(uid, finalEntry.created, fetchCount=1)
                if entriesLeft:
                    areDocumentsLeft = True
        
        return {"entries": entries, "finalEntry": finalEntry, "entryCount": max(0, count - 1), "areDocumentsLeft": areDocumentsLeft}
    

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error: {e}"
        )

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

    entry = await entryCollection.find_one({"authorID": uid, "created": dbDate})
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
        updateResult = await entryCollection.find_one_and_update({"authorID": uid, "created": dbDate}, {"$set": writeEntry})
        if updateResult is not None:
            return { "message": "yippie"}
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document does not exist"
        )

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True )