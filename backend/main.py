from typing import Annotated, Optional
from fastapi import Body, Depends, FastAPI, HTTPException, Response, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials, OAuth2PasswordBearer
from fastapi.middleware.cors import CORSMiddleware
from pymongo import ASCENDING
from contextlib import asynccontextmanager
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorCollection
from pydantic import BaseModel, BeforeValidator, Field
from typing import List
from dotenv import load_dotenv
import httpx
import os
import uvicorn
import redis

def main():
    print("Hello from backend!")


if __name__ == "__main__":
    main()
