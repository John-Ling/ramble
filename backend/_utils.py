from functools import wraps
from _types import *

async def get_entry_by_name(userCollection, userID: str, entryName: str):
    if userCollection is None:
        return None
    
    foundEntry = await userCollection.aggregate([
        {"$match": {"_id": userID}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            "$match": {
                "entries.name": entryName
            }
        },
        {"$limit": 1}
    ]).to_list(1)

    return foundEntry

async def get_entry_by_db_date(userCollection, userID: str, dbDate: str):
    if userCollection is None:
        return None
    
    foundEntry = await userCollection.aggregate([
        {"$match": {"_id": userID}},
        {"$unwind": {"path": "$entries", "includeArrayIndex": "entryIndex"}},
        {
            "$match": {
                "entries.createdOn": dbDate
            }
        },
        {"$limit": 1}
    ]).to_list(1)

    return foundEntry


def extend_pipeline(pipeline, dbDate: str, filterBy: FilterKey = FilterKey.entry, fetchCount = 12):
    """
    Function for cleaner code
    Extends a mongodb aggregation pipeline by adding
    a cutoff date based on fetchCount number of entries, day, weeks, months or years
    this allow the query of get all documents in the last n days
    """
    if filterBy == FilterKey.entry:
        pipeline.extend([{"$limit": fetchCount}])
    else:
        pipeline.extend([
            {
                "$addFields": {
                    "_cutoffDate": {"$dateSubtract": { "startDate": {"$dateFromString": {"dateString": dbDate}}, "unit": filterBy, "amount": fetchCount }}
                }
            },
            {
                "$match": {
                "$expr": {
                        "$gte": ["$_dateCreated", "$_cutoffDate"]
                    }
                }
            }
        ])
    
    return pipeline

# def protected_route(credentials):
#     def protected_route_payload(func):
#         @wraps(func)
#         async def wrapper(*args, **kwargs):


#             return await func(*args, **kwargs)
#         return wrapper
#     return protected_route_payload


# async def check_auth(uid: str, credentials: HTTPAuthorizationCredentials = Depends(bearerScheme)):
#     if redisStore is None:
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail="Redis is not running"
#         )
    
#     accessToken = credentials.credentials
#     logger.info(accessToken)
#     logger.info(redisStore.get(uid))

#     if redisStore.get(uid) == None:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="User does not exist"
#         )
    
#     if redisStore.get(uid) != accessToken:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="You are not authorised"
#         ) 
#     return