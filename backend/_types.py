from pydantic import BaseModel, BeforeValidator, Field
from enum import Enum
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

class UpdateJournalEntryEmotionData(BaseModel):
    neutral: Optional[float] = 0.0
    admiration: Optional[float] = 0.0
    amusement: Optional[float] = 0.0
    anger: Optional[float] = 0.0
    annoyance: Optional[float] = 0.0
    approval: Optional[float] = 0.0
    caring: Optional[float] = 0.0
    confusion: Optional[float] = 0.0
    curiosity: Optional[float] = 0.0
    desire: Optional[float] = 0.0
    disappointment: Optional[float] = 0.0
    disapproval: Optional[float] = 0.0
    disgust: Optional[float] = 0.0
    embarrassment: Optional[float] = 0.0
    excitement: Optional[float] = 0.0
    fear: Optional[float] = 0.0
    gratitude: Optional[float] = 0.0
    grief: Optional[float] = 0.0
    joy: Optional[float] = 0.0
    love: Optional[float] = 0.0
    nervousness: Optional[float] = 0.0
    optimism: Optional[float] = 0.0
    pride: Optional[float] = 0.0
    realization: Optional[float] = 0.0
    relief: Optional[float] = 0.0
    remorse: Optional[float] = 0.0
    sadness: Optional[float] = 0.0
    surprise: Optional[float] = 0.0    

class User(BaseModel):
    id: Optional[PyObjectId] = Field(alias="_id", default=None)
    entries: List[JournalEntryReference]


class AccessToken(BaseModel):
    sub: str
    token: str


class FilterKey(str, Enum):
    entry = "entry"
    day = "day"
    week = "week"
    month = "month"
    year = "year"


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
    realization: float = Field(default_factory=0.0)
    relief: float = Field(default_factory=0.0)
    remorse: float = Field(default_factory=0.0)
    sadness: float = Field(default_factory=0.0)
    surprise: float = Field(default_factory=0.0)    