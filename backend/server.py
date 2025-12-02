from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta, date
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail


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


# ============ PREREGISTRATION MODELS ============
class CoursePreregistration(BaseModel):
    courseSlug: str
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    message: Optional[str] = ""

class PreregistrationResponse(BaseModel):
    id: str = Field(alias="_id")
    courseSlug: str
    firstName: str
    lastName: str
    email: str
    phone: str
    message: Optional[str] = ""
    userId: str
    createdAt: datetime

    class Config:
        populate_by_name = True


# ============ WORKSHOP BOOKING MODELS ============
class WorkshopBookingRequest(BaseModel):
    workshopSlug: str
    selectedDate: str  # YYYY-MM-DD format
    timeSlot: str  # "morning" or "afternoon"
    participants: int = 1
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    originUrl: str  # Frontend URL for redirect

class WorkshopBookingResponse(BaseModel):
    id: str = Field(alias="_id")
    workshopSlug: str
    workshopTitle: str
    selectedDate: str
    timeSlot: str  # "morning" or "afternoon"
    timeSlotDisplay: str  # "09:00-12:00" or "14:00-17:00"
    participants: int
    firstName: str
    lastName: str
    email: str
    phone: str
    userId: str
    totalAmount: float
    paymentStatus: str  # "pending", "paid", "failed", "expired"
    stripeSessionId: Optional[str] = None
    createdAt: datetime
    paidAt: Optional[datetime] = None

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

@api_router.post("/courses/preregister", response_model=PreregistrationResponse)
async def preregister_course(
    preregistration: CoursePreregistration, 
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    user = await get_current_user(credentials)
    
    # Créer la pré-inscription
    preregistration_data = {
        "_id": str(uuid.uuid4()),
        "courseSlug": preregistration.courseSlug,
        "firstName": preregistration.firstName,
        "lastName": preregistration.lastName,
        "email": preregistration.email,
        "phone": preregistration.phone,
        "message": preregistration.message,
        "userId": user["_id"],
        "createdAt": datetime.utcnow()
    }
    
    # Sauvegarder dans MongoDB
    await db.course_preregistrations.insert_one(preregistration_data)
    
    return preregistration_data


# ============ WORKSHOPS ROUTES ============
@api_router.get("/workshops", response_model=List[WorkshopResponse])
async def get_workshops():
    # Ateliers avec photos depuis sepalis-garden-2
    workshops = [
        {
            "_id": "1",
            "title": "Apprendre la Taille des Arbres Fruitiers",
            "description": "Apprenez les gestes professionnels de taille des arbres fruitiers. Cet atelier pratique vous enseignera comment tailler vos pommiers, poiriers, cerisiers pour obtenir de belles récoltes. Sous l'œil expert d'un Meilleur Ouvrier de France, vous pratiquerez en situation réelle sur de vrais arbres dans le magnifique Jardin de Suzanne.",
            "date": "25 Février 2026",
            "location": "Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles",
            "duration": "Demi-journée (3h)",
            "price": 35,
            "maxParticipants": 10,
            "availableSpots": 10,
            "slug": "taille-arbres-fruitiers",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Taille", "Arbres fruitiers", "Formation", "Fructification"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1661137162009-030ab010ed65"
        },
        {
            "_id": "2",
            "title": "Taille et Soins des Rosiers",
            "description": "Atelier dédié à l'art de la taille des rosiers. Apprenez à tailler correctement vos rosiers buissons, grimpants, anciens pour obtenir une floraison abondante et saine. Découvrez les soins essentiels, grâce au paillage et aux plantes auxiliaires. Mise en pratique immédiate dans une roseraie professionnelle.",
            "date": "18 Mars 2026",
            "location": "Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles",
            "duration": "Demi-journée (3h)",
            "price": 35,
            "maxParticipants": 10,
            "availableSpots": 10,
            "slug": "taille-rosiers",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Taille", "Rosiers", "Maladies", "Protection"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1655467140395-67898511a759"
        },
        {
            "_id": "3",
            "title": "Créer et Entretenir des Massifs Fleuris",
            "description": "Apprenez à concevoir et réaliser des massifs fleuris spectaculaires. Cet atelier vous enseigne l'art d'associer les plantes, de jouer avec les couleurs et les textures pour créer des compositions harmonieuses. Mise en pratique avec la création d'un massif complet de A à Z.",
            "date": "20 Avril 2026",
            "location": "Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles",
            "duration": "Demi-journée (3h)",
            "price": 35,
            "maxParticipants": 10,
            "availableSpots": 10,
            "slug": "massifs-fleuris",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Massifs", "Composition", "Couleurs", "Association plantes"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1699216082520-c0d2f3b48240"
        },
        {
            "_id": "4",
            "title": "Tailler et Entretenir les Arbustes à Fleurs",
            "description": "Atelier spécialisé dans la taille et l'entretien des arbustes à fleurs (forsythia, lilas, weigelia, buddleia, etc.). Comprenez les principes de fructification de chaque espèce pour ne jamais vous tromper. Pratiquez sur une grande variété d'arbustes dans les conditions réelles d'un grand jardin.",
            "date": "11 Mai 2026",
            "location": "Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles",
            "duration": "Demi-journée (3h)",
            "price": 35,
            "maxParticipants": 10,
            "availableSpots": 10,
            "slug": "arbustes-fleurs",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Arbustes", "Floraison", "Taille", "Rajeunissement"],
            "level": "Tous niveaux",
            "image": "https://images.unsplash.com/photo-1648473293310-96c2130cb89c"
        },
        {
            "_id": "5",
            "title": "Créer et Gérer un Bassin avec Filtration par les Plantes",
            "description": "Découvrez comment créer et entretenir un bassin aquatique naturel avec filtration par les plantes. Apprenez à créer un écosystème équilibré où les plantes aquatiques assurent la filtration naturelle de l'eau. Visite et étude du bassin au Jardin de Suzanne.",
            "date": "12 Octobre 2026",
            "location": "Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles",
            "duration": "Demi-journée (3h)",
            "price": 35,
            "maxParticipants": 10,
            "availableSpots": 10,
            "slug": "bassin-filtration",
            "instructor": "Nicolas Blot, Meilleur Ouvrier de France",
            "topics": ["Bassin", "Filtration naturelle", "Plantes aquatiques", "Écosystème"],
            "level": "Tous niveaux",
            "image": "https://images.pexels.com/photos/158465/waterlily-pink-water-lily-water-plant-158465.jpeg"
        }
    ]
    return [WorkshopResponse(**workshop) for workshop in workshops]

# Helper function to get time slot display
def get_time_slot_display(slot: str) -> str:
    return "09:00-12:00" if slot == "morning" else "14:00-17:00"

# Helper function to send confirmation email
async def send_booking_confirmation_email(booking: dict, workshop_title: str):
    try:
        sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        from_email = os.getenv("SENDGRID_FROM_EMAIL", "contact@nicolasblot.com")
        
        time_slot_display = get_time_slot_display(booking["timeSlot"])
        
        message = Mail(
            from_email=from_email,
            to_emails=booking["email"],
            subject=f"Confirmation de réservation - {workshop_title}",
            html_content=f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2C5F2D;">✅ Réservation confirmée !</h2>
                    
                    <p>Bonjour {booking["firstName"]} {booking["lastName"]},</p>
                    
                    <p>Votre réservation pour l'atelier <strong>"{workshop_title}"</strong> a été confirmée et payée avec succès.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2C5F2D;">Détails de votre réservation</h3>
                        <p><strong>📅 Date :</strong> {booking["selectedDate"]}</p>
                        <p><strong>🕐 Horaire :</strong> {time_slot_display}</p>
                        <p><strong>👥 Participants :</strong> {booking["participants"]}</p>
                        <p><strong>💰 Montant payé :</strong> {booking["totalAmount"]}€</p>
                        <p><strong>📧 Email :</strong> {booking["email"]}</p>
                        <p><strong>📞 Téléphone :</strong> {booking["phone"]}</p>
                    </div>
                    
                    <p><strong>📍 Lieu :</strong> Jardin de Suzanne, rue des Bréards, 27260 Saint-Pierre-de-Cormeilles</p>
                    
                    <p>Nous vous attendons avec impatience ! N'oubliez pas d'apporter :</p>
                    <ul>
                        <li>Des vêtements adaptés au jardinage</li>
                        <li>Des gants de jardinage (facultatif)</li>
                        <li>Un cahier pour prendre des notes</li>
                    </ul>
                    
                    <p>En cas de question, n'hésitez pas à nous contacter à {from_email}</p>
                    
                    <p style="margin-top: 30px;">À bientôt,<br><strong>Nicolas Blot, Meilleur Ouvrier de France</strong><br>Sepalis</p>
                </div>
            </body>
            </html>
            """
        )
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        return response.status_code >= 200 and response.status_code < 300
    except Exception as e:
        logging.error(f"Error sending confirmation email: {str(e)}")
        return False

@api_router.post("/workshops/book")
async def create_workshop_booking(
    booking_request: WorkshopBookingRequest,
    credentials: HTTPAuthorizationCredentials = security
):
    """Create a workshop booking and initiate Stripe payment"""
    user = await get_current_user(credentials)
    
    # Get workshop details
    workshops_data = [
        {"slug": "taille-arbres-fruitiers", "title": "Apprendre la Taille des Arbres Fruitiers", "price": 35},
        {"slug": "taille-rosiers", "title": "Taille et Soins des Rosiers", "price": 35},
        {"slug": "massifs-fleuris", "title": "Créer et Entretenir des Massifs Fleuris", "price": 35},
        {"slug": "arbustes-fleurs", "title": "Tailler et Entretenir les Arbustes à Fleurs", "price": 35},
        {"slug": "bassin-filtration", "title": "Créer et Gérer un Bassin avec Filtration par les Plantes", "price": 35}
    ]
    
    workshop = next((w for w in workshops_data if w["slug"] == booking_request.workshopSlug), None)
    if not workshop:
        raise HTTPException(status_code=404, detail="Atelier non trouvé")
    
    # Calculate total amount
    total_amount = float(workshop["price"] * booking_request.participants)
    
    # Create booking record
    booking_id = str(uuid.uuid4())
    time_slot_display = get_time_slot_display(booking_request.timeSlot)
    
    booking_data = {
        "_id": booking_id,
        "workshopSlug": booking_request.workshopSlug,
        "workshopTitle": workshop["title"],
        "selectedDate": booking_request.selectedDate,
        "timeSlot": booking_request.timeSlot,
        "timeSlotDisplay": time_slot_display,
        "participants": booking_request.participants,
        "firstName": booking_request.firstName,
        "lastName": booking_request.lastName,
        "email": booking_request.email,
        "phone": booking_request.phone,
        "userId": user["_id"],
        "totalAmount": total_amount,
        "paymentStatus": "pending",
        "stripeSessionId": None,
        "createdAt": datetime.now(),
        "paidAt": None
    }
    
    # Save booking to database
    await db.workshop_bookings.insert_one(booking_data)
    
    # Initialize Stripe checkout
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        host_url = booking_request.originUrl
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        success_url = f"{host_url}/booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/academy"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking_id,
                "workshop_slug": booking_request.workshopSlug,
                "user_id": user["_id"],
                "type": "workshop_booking"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update booking with Stripe session ID
        await db.workshop_bookings.update_one(
            {"_id": booking_id},
            {"$set": {"stripeSessionId": session.session_id}}
        )
        
        # Create payment transaction record
        await db.payment_transactions.insert_one({
            "_id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "booking_id": booking_id,
            "user_id": user["_id"],
            "amount": total_amount,
            "currency": "eur",
            "payment_status": "pending",
            "metadata": checkout_request.metadata,
            "createdAt": datetime.now()
        })
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "booking_id": booking_id
        }
        
    except Exception as e:
        logging.error(f"Error creating Stripe checkout: {str(e)}")
        # Delete booking if Stripe checkout fails
        await db.workshop_bookings.delete_one({"_id": booking_id})
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du paiement: {str(e)}")

@api_router.get("/workshops/booking/{session_id}/status")
async def check_booking_status(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = security
):
    """Check the payment status of a workshop booking"""
    user = await get_current_user(credentials)
    
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        # Get checkout status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Find booking by session ID
        booking = await db.workshop_bookings.find_one({"stripeSessionId": session_id, "userId": user["_id"]})
        if not booking:
            raise HTTPException(status_code=404, detail="Réservation non trouvée")
        
        # Update booking and transaction status if paid
        if checkout_status.payment_status == "paid" and booking["paymentStatus"] != "paid":
            await db.workshop_bookings.update_one(
                {"_id": booking["_id"]},
                {"$set": {"paymentStatus": "paid", "paidAt": datetime.now()}}
            )
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updatedAt": datetime.now()}}
            )
            
            # Send confirmation email
            await send_booking_confirmation_email(booking, booking["workshopTitle"])
            
            return {
                "status": "paid",
                "booking": WorkshopBookingResponse(**booking)
            }
        
        elif checkout_status.status == "expired":
            await db.workshop_bookings.update_one(
                {"_id": booking["_id"]},
                {"$set": {"paymentStatus": "expired"}}
            )
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "expired", "updatedAt": datetime.now()}}
            )
            return {"status": "expired"}
        
        return {
            "status": checkout_status.payment_status,
            "booking": WorkshopBookingResponse(**booking)
        }
        
    except Exception as e:
        logging.error(f"Error checking booking status: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du statut")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            
            # Update booking status
            booking = await db.workshop_bookings.find_one({"stripeSessionId": session_id})
            if booking and booking["paymentStatus"] != "paid":
                await db.workshop_bookings.update_one(
                    {"_id": booking["_id"]},
                    {"$set": {"paymentStatus": "paid", "paidAt": datetime.now()}}
                )
                
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {"payment_status": "paid", "updatedAt": datetime.now()}}
                )
                
                # Send confirmation email
                await send_booking_confirmation_email(booking, booking["workshopTitle"])
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Webhook error: {str(e)}")
        raise HTTPException(status_code=400, detail="Webhook error")


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
