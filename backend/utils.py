from app import userCollection


async def get_entry_by_name(userID: str, entryName: str):
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

async def get_entry_by_db_date(userID: str, dbDate: str):
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