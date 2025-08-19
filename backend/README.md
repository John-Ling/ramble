## Ramble Backend

## TODO
- Set up either MongoDB or Redis Vector DB to hold emotion data as part of emotional analysis feature
- Set up Redis vector database for RAG system

Ramble's backend comprises of 
- MongoDB
- FastAPI middleware
- Redis for session management

Requests are sent from NextJS's route handlers to FastAPI which interacts with both Redis and MongoDB.

Redis is currently being used a glorified dictionary to map UIDs (subs) to access tokens in order to authenticate users
In the future Redis' vector database may be used for storing embeddings required for the RAG system.

## RAG System

Currently the outline for the RAG system is to use either Anthropic's or OpenAI's API 
for both generating responses and embeddings due to the hosting costs or general flakiness of other providers. 
Assume all data will be stored as text files.

Langchain will be used since I already have a somewhat working system. However it currently uses ChromaDB instead of Redis Vector DB.
Integration shouldn't be difficult since Langchain provides helper functions for working with Redis
