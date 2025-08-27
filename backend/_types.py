from pydantic import BaseModel, BeforeValidator, Field
from typing import Optional, Annotated, List

PyObjectId = Annotated[str, BeforeValidator(str)]

class JournalEntryReqBody(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None) # consists of user's id + a unique uuid
    authorID: str = ""
    name: str = "" # assume name is unique
    createdOn: str = ""
    favourite: bool = False
    content: str = ""

class JournalEntryReference(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    authorID: str = ""
    createdOn: str = ""
    name: str = ""
    favourite: bool = False

class JournalEntry(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None) 
    content: str = ""

class UpdateJournalEntry(BaseModel):
    content: Optional[str] = None

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    entries: List[JournalEntryReference]


class AccessToken(BaseModel):
    sub: str
    token: str


class JournalEntryEmotionData(BaseModel):
    id:  Optional[PyObjectId] = Field(alias="_id", default=None) 
    created: PyObjectId
    authorID: PyObjectId
    neutral: float = Field(default_factory=0.0)
    admiration: float = Field(default_factory=0.0)
    amusement: float = Field(default_factory=0.0)
    anger: float = Field(default_factory=0.0)
    annoyance: float = Field(default_factory=0.0)
    approval: float = Field(default_factory=0.0)
    caring: float = Field(default_factory=0.0)
    confusion: float = Field(default_factory=0.0)
    curiosity: float = Field(default_factory=0.0)
    desire: float = Field(default_factory=0.0)
    disappointment: float = Field(default_factory=0.0)
    disapproval: float = Field(default_factory=0.0)
    disgust: float = Field(default_factory=0.0)
    embarrassment: float = Field(default_factory=0.0)
    excitement: float = Field(default_factory=0.0)
    fear: float = Field(default_factory=0.0)
    gratitude: float = Field(default_factory=0.0)
    grief: float = Field(default_factory=0.0)
    joy: float = Field(default_factory=0.0)
    love: float = Field(default_factory=0.0)
    nervousness: float = Field(default_factory=0.0)
    optimism: float = Field(default_factory=0.0)
    pride: float = Field(default_factory=0.0)
    realisation: float = Field(default_factory=0.0)
    relief: float = Field(default_factory=0.0)
    remorse: float = Field(default_factory=0.0)
    sadness: float = Field(default_factory=0.0)
    surprise: float = Field(default_factory=0.0)    