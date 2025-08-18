from pydantic import BaseModel, BeforeValidator, Field
from typing import Optional, Annotated, List


PyObjectId = Annotated[str, BeforeValidator(str)]

class Token(BaseModel):
    accessToken: str
    type: str


class JournalEntryReference(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    name: str = ""
    favourite: bool = False

# Maybe change to journal entry content later
class JournalEntry(BaseModel):
    id:  Optional[PyObjectId] = Field(alias="_id", default=None) 
    authorID: PyObjectId
    created: PyObjectId
    content: str = ""

class UpdateJournalEntry(BaseModel):
    content: Optional[str] = None

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    entries: List[JournalEntryReference]


class AccessToken(BaseModel):
    sub: str
    token: str