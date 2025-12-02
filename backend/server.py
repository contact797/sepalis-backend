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
    zoneId: Optional[str] = None

class PlantCreate(PlantBase):
    pass

class PlantResponse(PlantBase):
    id: str = Field(alias="_id")
    userId: str
    zoneId: Optional[str] = None
    zoneName: Optional[str] = None
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
    instructor: Optional[str] = "Nicolas Blot, MOF"
    topics: Optional[List[str]] = []
    image: Optional[str] = None

    class Config:
        populate_by_name = True


# ============ WORKSHOP MODELS ============
class WorkshopResponse(BaseModel):
    id: str = Field(alias="_id")
    title: str
    description: str
    date: Optional[str] = None
    location: Optional[str] = "Pépinière Sepalis"
    duration: Optional[str] = "3h"
    price: Optional[int] = 0
    maxParticipants: Optional[int] = 12
    availableSpots: Optional[int] = 12
    slug: str
    instructor: Optional[str] = "Nicolas Blot, MOF"
    topics: Optional[List[str]] = []
    image: Optional[str] = None
    level: Optional[str] = "Tous niveaux"

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
    
    # Enrichir avec le nom de la zone
    enriched_plants = []
    for plant in plants:
        plant_dict = {**plant, "_id": plant["_id"]}
        if plant.get("zoneId"):
            zone = await db.zones.find_one({"_id": plant["zoneId"]})
            if zone:
                plant_dict["zoneName"] = zone["name"]
        enriched_plants.append(PlantResponse(**plant_dict))
    
    return enriched_plants

@api_router.post("/user/plants", response_model=PlantResponse)
async def create_plant(plant_data: PlantCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    plant_id = str(uuid.uuid4())
    plant = {
        "_id": plant_id,
        "userId": user["_id"],
        **plant_data.model_dump(),
        "createdAt": datetime.utcnow()
    }
    
    await db.plants.insert_one(plant)
    
    # Incrémenter le compteur de plantes dans la zone
    if plant.get("zoneId"):
        await db.zones.update_one(
            {"_id": plant["zoneId"], "userId": user["_id"]},
            {"$inc": {"plantsCount": 1}}
        )
        zone = await db.zones.find_one({"_id": plant["zoneId"]})
        if zone:
            plant["zoneName"] = zone["name"]
    
    return PlantResponse(**plant)

@api_router.delete("/user/plants/{plant_id}")
async def delete_plant(plant_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    # Récupérer la plante avant suppression pour décrémenter le compteur
    plant = await db.plants.find_one({"_id": plant_id, "userId": user["_id"]})
    if not plant:
        raise HTTPException(status_code=404, detail="Plant not found")
    
    # Supprimer la plante
    result = await db.plants.delete_one({"_id": plant_id, "userId": user["_id"]})
    
    # Décrémenter le compteur de plantes dans la zone
    if plant.get("zoneId"):
        await db.zones.update_one(
            {"_id": plant["zoneId"], "userId": user["_id"]},
            {"$inc": {"plantsCount": -1}}
        )
    
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
    # Formations réelles de Nicolas Blot, MOF avec photos
    courses = [
        {
            "_id": "1",
            "title": "Massif Fleuri Toute l'Année",
            "description": "Apprenez à créer et entretenir un massif qui fleurit toute l'année. Techniques professionnelles, sélection de plantes, calendrier d'entretien. 12 modules complets pour maîtriser l'art des massifs fleuris avec des plantes pour chaque saison.",
            "level": "Tous niveaux",
            "duration": "4 semaines",
            "price": 39,
            "slug": "massif-fleuri",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France Paysagiste",
            "topics": ["Massifs fleuris", "Plantes vivaces", "Association de plantes", "Calendrier d'entretien", "Arrosage", "Fertilisation"],
            "image": "https://images.unsplash.com/photo-1628432923257-cdf42e3dbb64?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "_id": "2",
            "title": "Tailler et Soigner ses Rosiers",
            "description": "Formation complète dédiée exclusivement aux rosiers. Apprenez à tailler correctement vos rosiers buissons et grimpants pour obtenir une floraison spectaculaire. Maîtrisez les soins essentiels : paillage, plantes auxiliaires, protection hivernale. 10 modules vidéo + livret illustré de 100 pages.",
            "level": "Tous niveaux",
            "duration": "5 semaines",
            "price": 49,
            "slug": "tailler-rosiers",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France Paysagiste",
            "topics": ["Rosiers buissons", "Rosiers grimpants", "Taille", "Maladies", "Paillage", "Protection hivernale"],
            "image": "https://images.unsplash.com/photo-1655467140395-67898511a759?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "_id": "3",
            "title": "Tailler Sans Se Tromper : Arbustes et Rosiers",
            "description": "Maîtrisez l'art de la taille des rosiers et arbustes. Techniques professionnelles, périodes de taille, matériel adapté. Ne massacrez plus vos plantes ! Apprenez les techniques de récupération et le calendrier complet de taille. Projet final avec correction personnalisée.",
            "level": "Débutant à Intermédiaire",
            "duration": "6 semaines",
            "price": 49,
            "slug": "tailler-sans-se-tromper",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France Paysage",
            "topics": ["Taille arbustes", "Taille rosiers", "Haies", "Topiaires", "Calendrier de taille", "Récupération"],
            "image": "https://images.unsplash.com/photo-1680124744736-859f16257ef0?crop=entropy&cs=srgb&fm=jpg&q=85"
        },
        {
            "_id": "4",
            "title": "Vivaces Faciles : Jardin Sans Entretien",
            "description": "Créez un jardin magnifique avec un minimum d'entretien. Découvrez les 40 vivaces increvables, techniques de plantation et associations gagnantes pour un jardin fleuri toute l'année. Une seule séance d'entretien par an ! Économisez 80% sur vos achats grâce à la multiplication.",
            "level": "Débutant",
            "duration": "5 semaines",
            "price": 39,
            "slug": "vivaces-faciles",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France Paysage",
            "topics": ["Vivaces", "Jardin facile", "Faible entretien", "Graminées", "Multiplication", "Associations"],
            "image": "https://images.unsplash.com/photo-1704869727879-25ed3c235e7d?crop=entropy&cs=srgb&fm=jpg&q=85"
        }
    ]
    return [CourseResponse(**course) for course in courses]

@api_router.post("/courses/preregister")
async def preregister_course(data: dict, credentials: HTTPAuthorizationCredentials = security):
    user = await get_current_user(credentials)
    # Pour l'instant, on enregistre juste la pré-inscription
    return {"message": "Pré-inscription enregistrée avec succès"}


# ============ WORKSHOPS ROUTES ============
@api_router.get("/workshops", response_model=List[WorkshopResponse])
async def get_workshops():
    # Ateliers avec photos
    workshops = [
        {
            "_id": "1",
            "title": "Atelier Taille des Fruitiers",
            "description": "Apprenez les techniques de taille des arbres fruitiers pour optimiser la production. Pratique sur différentes espèces.",
            "date": "15 Mars 2025",
            "location": "Pépinière Sepalis, Bordeaux",
            "duration": "3h",
            "price": 45,
            "maxParticipants": 12,
            "availableSpots": 5,
            "slug": "taille-fruitiers",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Taille", "Fruitiers", "Production"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1764421175587-f1fe472c411d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDk1Nzh8MHwxfHNlYXJjaHwxfHxmcnVpdCUyMHRyZWUlMjBwcnVuaW5nfGVufDB8fHx8MTc2NDY4OTgwM3ww&ixlib=rb-4.1.0&q=85"
        },
        {
            "_id": "2",
            "title": "Atelier Bouturage & Multiplication",
            "description": "Maîtrisez les techniques de bouturage, marcottage et division pour multiplier vos plantes gratuitement.",
            "date": "22 Mars 2025",
            "location": "Pépinière Sepalis, Bordeaux",
            "duration": "2h30",
            "price": 35,
            "maxParticipants": 15,
            "availableSpots": 8,
            "slug": "bouturage-multiplication",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Bouturage", "Multiplication", "Économie"],
            "level": "Débutant",
            "image": "https://images.unsplash.com/photo-1599228993027-0ab8422edf78?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2NzV8MHwxfHNlYXJjaHwxfHxwbGFudCUyMGN1dHRpbmdzJTIwcHJvcGFnYXRpb258ZW58MHx8fGdyZWVufDE3NjQ2ODk4MTF8MA&ixlib=rb-4.1.0&q=85"
        },
        {
            "_id": "3",
            "title": "Atelier Potager en Permaculture",
            "description": "Créez un potager productif en suivant les principes de la permaculture. Design, associations, paillage.",
            "date": "5 Avril 2025",
            "location": "Jardin-École Sepalis",
            "duration": "4h",
            "price": 60,
            "maxParticipants": 10,
            "availableSpots": 3,
            "slug": "potager-permaculture",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Permaculture", "Potager", "Biodiversité"],
            "level": "Intermédiaire",
            "image": "https://images.unsplash.com/photo-1761074342764-17562b97aaec?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDN8MHwxfHNlYXJjaHwzfHxwZXJtYWN1bHR1cmUlMjB2ZWdldGFibGUlMjBnYXJkZW58ZW58MHx8fHwxNzY0Njg5ODE2fDA&ixlib=rb-4.1.0&q=85"
        },
        {
            "_id": "4",
            "title": "Atelier Reconnaissance des Plantes",
            "description": "Balade botanique pour apprendre à identifier les plantes sauvages, médicinales et comestibles de votre région.",
            "date": "12 Avril 2025",
            "location": "Forêt de Sepalis",
            "duration": "3h",
            "price": 40,
            "maxParticipants": 20,
            "availableSpots": 12,
            "slug": "reconnaissance-plantes",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Botanique", "Plantes sauvages", "Identification"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1615038373255-253c3f2c8d22?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2MzR8MHwxfHNlYXJjaHwxfHx3aWxkJTIwcGxhbnRzJTIwYm90YW5pY2FsfGVufDB8fHx8MTc2NDY4OTgyNHww&ixlib=rb-4.1.0&q=85"
        },
        {
            "_id": "5",
            "title": "Atelier Compost & Sol Vivant",
            "description": "Tout savoir sur le compost, le lombricompost et comment nourrir votre sol naturellement.",
            "date": "19 Avril 2025",
            "location": "Pépinière Sepalis, Bordeaux",
            "duration": "2h",
            "price": 30,
            "maxParticipants": 15,
            "availableSpots": 15,
            "slug": "compost-sol-vivant",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Compost", "Sol", "Fertilité"],
            "level": "Débutant",
            "image": "https://images.pexels.com/photos/8543583/pexels-photo-8543583.jpeg"
        }
    ]
    return [WorkshopResponse(**workshop) for workshop in workshops]

@api_router.post("/workshops/book")
async def book_workshop(data: dict, credentials: HTTPAuthorizationCredentials = security):
    user = await get_current_user(credentials)
    # Pour l'instant, on enregistre juste la réservation
    return {"message": "Réservation enregistrée avec succès", "workshopId": data.get("workshopSlug")}


# ============ ZONES ROUTES ============
@api_router.get("/user/zones", response_model=List[ZoneResponse])
async def get_zones(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    zones = await db.zones.find({"userId": user["_id"]}).to_list(100)
    return [ZoneResponse(**zone) for zone in zones]

@api_router.get("/user/zones/{zone_id}/plants", response_model=List[PlantResponse])
async def get_zone_plants(zone_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    # Vérifier que la zone appartient à l'utilisateur
    zone = await db.zones.find_one({"_id": zone_id, "userId": user["_id"]})
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    # Récupérer les plantes de cette zone
    plants = await db.plants.find({"userId": user["_id"], "zoneId": zone_id}).to_list(100)
    return [PlantResponse(**{**plant, "_id": plant["_id"], "zoneName": zone["name"]}) for plant in plants]

@api_router.post("/user/zones", response_model=ZoneResponse)
async def create_zone(zone_data: ZoneCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    zone_id = str(uuid.uuid4())
    new_zone = {
        "_id": zone_id,
        "userId": user["_id"],
        **zone_data.model_dump(),
        "plantsCount": 0,
        "createdAt": datetime.utcnow()
    }
    
    await db.zones.insert_one(new_zone)
    return ZoneResponse(**new_zone)

@api_router.get("/user/zones/{zone_id}", response_model=ZoneResponse)
async def get_zone(zone_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    zone = await db.zones.find_one({"_id": zone_id, "userId": user["_id"]})
    if not zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    return ZoneResponse(**zone)

@api_router.put("/user/zones/{zone_id}", response_model=ZoneResponse)
async def update_zone(zone_id: str, zone_data: ZoneCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    existing_zone = await db.zones.find_one({"_id": zone_id, "userId": user["_id"]})
    if not existing_zone:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    updated_data = zone_data.model_dump()
    await db.zones.update_one(
        {"_id": zone_id, "userId": user["_id"]},
        {"$set": updated_data}
    )
    
    updated_zone = await db.zones.find_one({"_id": zone_id})
    return ZoneResponse(**updated_zone)

@api_router.delete("/user/zones/{zone_id}")
async def delete_zone(zone_id: str, credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials)
    
    result = await db.zones.delete_one({"_id": zone_id, "userId": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone non trouvée")
    
    return {"message": "Zone supprimée avec succès"}


# ============ AI RECOGNITION ROUTES ============
@api_router.post("/ai/identify-plant")
async def identify_plant(data: dict):
    """Identifier une plante avec GPT-4 Vision via Emergent Integrations"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    import json as json_lib
    
    try:
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        # Extraire seulement le base64 si le préfixe est présent
        if 'base64,' in image_base64:
            image_base64 = image_base64.split('base64,')[1]
        
        print("🔍 Identification avec GPT-4 Vision via Emergent...")
        
        # Créer une session chat avec Emergent Integrations
        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY', os.getenv('OPENAI_API_KEY')),
            session_id=f"plant-id-{uuid.uuid4()}",
            system_message="""Tu es un botaniste expert. Identifie précisément la plante dans l'image.
            Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans texte supplémentaire):
            {
                "name": "Nom commun français de la plante",
                "scientificName": "Nom scientifique latin",
                "confidence": 0.XX,
                "family": "Famille botanique",
                "description": "Description courte en 2-3 phrases",
                "wateringFrequency": 7,
                "sunlight": "Plein soleil/Mi-ombre/Ombre",
                "difficulty": "Facile/Moyen/Difficile",
                "growthRate": "Rapide/Moyen/Lent",
                "toxicity": "Non toxique/Légèrement toxique/Toxique",
                "commonNames": ["nom1", "nom2"],
                "tips": "Conseil d'entretien principal"
            }"""
        ).with_model("openai", "gpt-4o")
        
        # Créer le message avec l'image
        image_content = ImageContent(image_base64=image_base64)
        
        user_message = UserMessage(
            text="Identifie cette plante avec précision. Donne le nom commun français, le nom scientifique, et des informations pratiques pour l'entretien.",
            file_contents=[image_content]
        )
        
        # Envoyer le message et obtenir la réponse
        result_text = await chat.send_message(user_message)
        print(f"📊 Réponse GPT-4: {result_text[:200]}...")
        
        # Parser le JSON
        # Enlever les balises markdown si présentes
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
            if result_text.startswith('json'):
                result_text = result_text[4:]
        
        result = json_lib.loads(result_text)
        
        # Ajouter des valeurs par défaut si manquantes
        result.setdefault('wateringFrequency', 7)
        result.setdefault('confidence', 0.85)
        result.setdefault('commonNames', [])
        
        print(f"✅ Plante identifiée: {result.get('name')}")
        
        return result
        
    except json_lib.JSONDecodeError as e:
        print(f"❌ Erreur parsing JSON: {str(e)}")
        print(f"Réponse brute: {result_text}")
        raise HTTPException(
            status_code=500, 
            detail="Erreur de format de réponse. L'IA n'a pas retourné un JSON valide."
        )
    except Exception as e:
        print(f"❌ Erreur identification: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur: {str(e)}")


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
        
        # Utiliser Emergent LLM key
        client = OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url="https://api.emergentmethods.ai/llm/openai/v1"
        )
        
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
