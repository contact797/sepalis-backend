from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'sepalis')]

# Create FastAPI app
app = FastAPI(title="Sepalis API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Sepalis Backend API - Version simplifiée"}

@app.get("/api/")
async def api_root():
    return {"message": "Sepalis API - Votre jardin connecté"}

@app.get("/health")
async def health():
    return {"status": "ok"}
