## RAMBLE

### Setting up Frontend

```
cd frontend/
npm install
npm run dev
```

### Setting Up Backend

Start middleware
```
cd backend/
uv venv
source .venv/bin/activate
uv run app.py
```

Start Redis
```
docker compose up
```


## TODO 
- RAG System (Conversation mode) (Shelved)
- Emotion classification via pretrained transformer and plotting using PlotlyJS (Current)
- Symmetric encryption of journal entries via either ADMIN secret (easy) or user defined secret (less easy)
- "Get organised" feature (think original Ramble with generating timetables) (optional)
- Make upload code more robust and reduce errors when uploading many files
