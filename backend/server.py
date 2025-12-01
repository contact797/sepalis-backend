from fastapi import FastAPI, APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "sepalis-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI(title="Sepalis API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ============ AUTH MODELS ============
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse


# ============ PLANT MODELS ============
class PlantBase(BaseModel):
    name: str
    scientificName: Optional[str] = None
    wateringFrequency: Optional[int] = 7
    description: Optional[str] = None

class PlantCreate(PlantBase):
    pass

class PlantResponse(PlantBase):
    id: str = Field(alias="_id")
    userId: str
    createdAt: datetime

    class Config:
        populate_by_name = True


# ============ TASK MODELS ============
class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    type: Optional[str] = "general"  # watering, fertilizing, pruning, general
    dueDate: Optional[datetime] = None
    completed: bool = False

class TaskCreate(TaskBase):
    plantId: Optional[str] = None

class TaskResponse(TaskBase):
    id: str = Field(alias="_id")
    userId: str
    plantId: Optional[str] = None
    createdAt: datetime

    class Config:
        populate_by_name = True


# ============ COURSE MODELS ============
class CourseResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    level: Optional[str] = "Tous niveaux"
    duration: Optional[str] = "2h"
    price: Optional[int] = 0
    slug: str

    class Config:
        populate_by_name = True


# ============ ZONE MODELS ============
class ZoneBase(BaseModel):
    name: str
    type: str  # vegetable, ornamental, orchard, herb
    length: float
    width: float
    area: float
    soilType: str
    soilPH: str
    drainage: str
    sunExposure: str
    climateZone: str
    windProtection: str
    wateringSystem: str
    humidity: str
    notes: Optional[str] = ""
    color: str

class ZoneCreate(ZoneBase):
    pass

class ZoneResponse(ZoneBase):
    id: str = Field(alias="_id")
    userId: str
    plantsCount: int = 0
    createdAt: datetime

    class Config:
        populate_by_name = True


# ============ AUTH HELPERS ============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = security):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ============ AUTH ROUTES ============
@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    user_id = str(uuid.uuid4())
    hashed_password = hash_password(user_data.password)
    
    new_user = {
        "_id": user_id,
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "createdAt": datetime.utcnow()
    }
    
    await db.users.insert_one(new_user)
    
    # Create token
    token = create_access_token({"sub": user_id})
    
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user_data.email, name=user_data.name)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_access_token({"sub": user["_id"]})
    
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["_id"], email=user["email"], name=user["name"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    return UserResponse(id=user["_id"], email=user["email"], name=user["name"])


# ============ PLANTS ROUTES ============
@api_router.get("/user/plants", response_model=List[PlantResponse])
async def get_user_plants(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    plants = await db.plants.find({"userId": user["_id"]}).to_list(100)
    return [PlantResponse(**{**plant, "_id": plant["_id"]}) for plant in plants]

@api_router.post("/user/plants", response_model=PlantResponse)
async def create_plant(plant_data: PlantCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    plant_id = str(uuid.uuid4())
    plant = {
        "_id": plant_id,
        "userId": user["_id"],
        **plant_data.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.plants.insert_one(plant)
    return PlantResponse(**plant)

@api_router.delete("/user/plants/{plant_id}")
async def delete_plant(plant_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    result = await db.plants.delete_one({"_id": plant_id, "userId": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Plant not found")
    return {"message": "Plant deleted successfully"}


# ============ TASKS ROUTES ============
@api_router.get("/user/tasks", response_model=List[TaskResponse])
async def get_user_tasks(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    tasks = await db.tasks.find({"userId": user["_id"]}).to_list(100)
    return [TaskResponse(**{**task, "_id": task["_id"]}) for task in tasks]

@api_router.post("/user/tasks", response_model=TaskResponse)
async def create_task(task_data: TaskCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    task_id = str(uuid.uuid4())
    task = {
        "_id": task_id,
        "userId": user["_id"],
        **task_data.dict(),
        "createdAt": datetime.utcnow()
    }
    
    await db.tasks.insert_one(task)
    return TaskResponse(**task)

@api_router.post("/user/tasks/{task_id}/complete")
async def complete_task(task_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    result = await db.tasks.update_one(
        {"_id": task_id, "userId": user["_id"]},
        {"$set": {"completed": True}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task completed"}

@api_router.delete("/user/tasks/{task_id}")
async def delete_task(task_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    result = await db.tasks.delete_one({"_id": task_id, "userId": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Task not found")
    return {"message": "Task deleted successfully"}


# ============ COURSES ROUTES ============
@api_router.get("/courses", response_model=List[CourseResponse])
async def get_courses():
    # Retourner des cours fictifs pour le moment
    courses = [
        {
            "_id": "1",
            "title": "Initiation au jardinage bio",
            "description": "Découvrez les bases du jardinage biologique et apprenez à cultiver vos premiers légumes sans produits chimiques.",
            "level": "Débutant",
            "duration": "2h30",
            "price": 39,
            "slug": "initiation-jardinage-bio"
        },
        {
            "_id": "2",
            "title": "Maîtriser le compost",
            "description": "Apprenez toutes les techniques pour réaliser un compost de qualité et enrichir votre sol naturellement.",
            "level": "Intermédiaire",
            "duration": "1h45",
            "price": 29,
            "slug": "maitriser-compost"
        },
        {
            "_id": "3",
            "title": "Potager urbain",
            "description": "Créez votre potager sur balcon ou terrasse. Techniques adaptées aux petits espaces.",
            "level": "Tous niveaux",
            "duration": "3h",
            "price": 49,
            "slug": "potager-urbain"
        },
        {
            "_id": "4",
            "title": "Permaculture avancée",
            "description": "Conception et gestion d'un jardin en permaculture. Pour jardiniers expérimentés.",
            "level": "Avancé",
            "duration": "4h",
            "price": 69,
            "slug": "permaculture-avancee"
        }
    ]
    return [CourseResponse(**course) for course in courses]

@api_router.post("/courses/preregister")
async def preregister_course(data: dict, credentials: HTTPAuthorizationCredentials = security):
    user = await get_current_user(credentials)
    # Pour l'instant, on enregistre juste la pré-inscription
    return {"message": "Pré-inscription enregistrée avec succès"}


# ============ AI RECOGNITION ROUTES ============
@api_router.post("/ai/identify-plant")
async def identify_plant(data: dict):
    """Identifier une plante avec Plant.id API"""
    import requests
    import base64
    
    try:
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        # Enlever le préfixe data:image si présent
        if 'base64,' in image_base64:
            image_base64 = image_base64.split('base64,')[1]
        
        plantid_key = os.getenv('PLANTID_API_KEY')
        
        # Appel API Plant.id
        response = requests.post(
            'https://plant.id/api/v3/identification',
            json={
                'images': [image_base64],
                'latitude': 48.8566,  # Paris par défaut
                'longitude': 2.3522,
                'similar_images': True,
            },
            headers={
                'Api-Key': plantid_key,
                'Content-Type': 'application/json',
            },
            timeout=30
        )
        
        if response.status_code != 200:
            raise HTTPException(status_code=500, detail="Erreur Plant.id API")
        
        result = response.json()
        
        # Extraire les informations principales
        if result.get('result') and result['result'].get('classification'):
            suggestions = result['result']['classification']['suggestions']
            if suggestions:
                best_match = suggestions[0]
                return {
                    'name': best_match['name'],
                    'scientificName': best_match.get('details', {}).get('scientific_name', best_match['name']),
                    'confidence': best_match['probability'],
                    'commonNames': best_match.get('details', {}).get('common_names', []),
                    'description': best_match.get('details', {}).get('description', {}).get('value', 'Plante identifiée'),
                    'wateringFrequency': 7,  # Valeur par défaut
                    'images': [img.get('url') for img in best_match.get('similar_images', [])[:3]],
                }
        
        raise HTTPException(status_code=404, detail="Plante non identifiée")
        
    except Exception as e:
        print(f"Erreur identification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/ai/diagnose-disease")
async def diagnose_disease(data: dict):
    """Diagnostiquer une maladie avec OpenAI Vision"""
    from openai import OpenAI
    
    try:
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        # S'assurer que l'image a le bon format
        if not image_base64.startswith('data:image'):
            image_base64 = f"data:image/jpeg;base64,{image_base64}"
        
        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        
        # Appel OpenAI Vision
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert en pathologie végétale. Analyse l'image de la plante et fournis un diagnostic détaillé en français. Réponds UNIQUEMENT au format JSON suivant sans aucun texte supplémentaire: {\"disease\": \"nom de la maladie\", \"confidence\": 0.XX, \"severity\": \"Léger/Modéré/Grave\", \"description\": \"description\", \"symptoms\": [\"symptome1\", \"symptome2\"], \"solutions\": [\"solution1\", \"solution2\"], \"prevention\": [\"conseil1\", \"conseil2\"]}"
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "Analyse cette plante et détecte les éventuelles maladies ou problèmes. Si la plante est saine, indique-le."
                        },
                        {
                            "type": "image_url",
                            "image_url": {"url": image_base64}
                        }
                    ]
                }
            ],
            max_tokens=1000,
            temperature=0.3,
        )
        
        # Extraire la réponse
        content = response.choices[0].message.content
        
        # Parser le JSON
        import json
        diagnosis = json.loads(content)
        
        return diagnosis
        
    except Exception as e:
        print(f"Erreur diagnostic: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ ROOT ROUTE ============
@api_router.get("/")
async def root():
    return {"message": "Sepalis API - Votre jardin connecté"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
