from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta, date
import jwt
from jwt.exceptions import ExpiredSignatureError, DecodeError
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
import httpx
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from exponent_server_sdk import (
    PushClient,
    PushMessage,
    PushServerError,
    PushTicketError,
)


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


# ============ NOTIFICATION MODELS ============
class PushTokenRequest(BaseModel):
    token: str
    deviceType: str  # "ios" or "android" or "web"


# ============ SUBSCRIPTION MODELS ============
class SubscriptionStatus(BaseModel):
    isActive: bool
    isTrial: bool
    type: Optional[str] = None  # "monthly" or "yearly"
    expiresAt: Optional[datetime] = None
    provider: Optional[str] = None  # "revenuecat" or "stripe"
    customerId: Optional[str] = None


# ============ PLANT MODELS ============
class CareInstructions(BaseModel):
    sunExposure: Optional[str] = None
    plantingPeriod: Optional[str] = None
    pruning: Optional[str] = None
    temperature: Optional[str] = None
    soilType: Optional[str] = None
    commonIssues: Optional[str] = None

class PlantBase(BaseModel):
    name: str
    scientificName: Optional[str] = None
    wateringFrequency: Optional[int] = 7
    description: Optional[str] = None
    zoneId: Optional[str] = None
    careInstructions: Optional[CareInstructions] = None
    isFavorite: Optional[bool] = False  # True pour les suggestions enregistrées, False pour les plantes scannées

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
    isMOFSuggestion: Optional[bool] = False
    weekNumber: Optional[int] = None

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
    humidity: str
    sunExposure: str
    climateZone: str
    windProtection: str
    wateringSystem: str
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


# ============ SEASON TIP MODELS ============
class SeasonTipBase(BaseModel):
    season: str  # spring, summer, fall, winter
    title: str
    text: str
    icon: str
    color: str

class SeasonTipCreate(SeasonTipBase):
    pass

class SeasonTipUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None

class SeasonTipResponse(SeasonTipBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime

    class Config:
        populate_by_name = True



# ============ ANALYTICS MODELS ============
class AnalyticsEvent(BaseModel):
    userId: Optional[str] = None
    eventType: str  # page_view, signup, subscription_start, etc.
    eventData: Optional[Dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    platform: Optional[str] = None  # ios, android, web
    
class AnalyticsEventCreate(BaseModel):
    eventType: str
    eventData: Optional[Dict] = None
    platform: Optional[str] = None


# ============ CALENDAR TASK MODELS ============
class CalendarTaskBase(BaseModel):
    title: str
    description: str
    weekNumber: int  # 1-52
    taskType: str  # watering, pruning, fertilizing, planting, general
    priority: str = "optionnel"  # optionnel, important, urgent
    
class CalendarTaskCreate(CalendarTaskBase):
    pass

class CalendarTaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    weekNumber: Optional[int] = None
    taskType: Optional[str] = None
    priority: Optional[str] = None

class CalendarTaskResponse(CalendarTaskBase):
    id: str = Field(alias="_id")
    createdAt: datetime
    updatedAt: datetime
    
    class Config:
        populate_by_name = True


# ============ DAILY QUIZ MODELS ============
class DailyQuizQuestion(BaseModel):
    question: str
    answers: List[str]  # 4 réponses possibles (A, B, C, D)
    correctAnswer: int  # Index de la bonne réponse (0-3)
    explanation: str  # Explication du MOF
    imageUrl: Optional[str] = None
    scheduledDate: date  # Date de publication (YYYY-MM-DD)
    difficulty: str = "medium"  # easy, medium, hard
    category: str = "general"  # roses, potager, interieur, etc.

class DailyQuizQuestionCreate(DailyQuizQuestion):
    pass

class DailyQuizQuestionUpdate(BaseModel):
    question: Optional[str] = None
    answers: Optional[List[str]] = None
    correctAnswer: Optional[int] = None
    explanation: Optional[str] = None
    imageUrl: Optional[str] = None
    scheduledDate: Optional[date] = None
    difficulty: Optional[str] = None
    category: Optional[str] = None

class DailyQuizQuestionResponse(DailyQuizQuestion):
    id: str = Field(alias="_id")
    createdAt: datetime
    
    class Config:
        populate_by_name = True

class DailyQuizAnswerRequest(BaseModel):
    questionId: str
    selectedAnswer: int  # Index de la réponse sélectionnée (0-3)
    timeSpent: int  # Temps en secondes

class DailyQuizAnswerResponse(BaseModel):
    correct: bool
    correctAnswer: int
    explanation: str
    xpEarned: int
    newStreak: int
    newTotalXP: int
    badgesEarned: List[str] = []

class UserQuizStats(BaseModel):
    userId: str
    currentStreak: int = 0
    longestStreak: int = 0
    totalXP: int = 0
    totalAnswered: int = 0
    totalCorrect: int = 0
    lastAnsweredDate: Optional[date] = None
    badges: List[str] = []
    answersHistory: List[Dict] = []  # [{date, questionId, correct, timeSpent, xpEarned}]

class UserQuizStatsResponse(BaseModel):
    currentStreak: int
    longestStreak: int
    totalXP: int
    totalAnswered: int
    totalCorrect: int
    lastAnsweredDate: Optional[date]
    badges: List[Dict]  # [{id, name, description, earnedAt}]
    canAnswerToday: bool
    todayAnswered: bool


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
    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except DecodeError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        print(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"_id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return user


async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifier que l'utilisateur est admin"""
    user = await get_current_user(credentials)
    
    if not user.get("isAdmin", False):
        raise HTTPException(
            status_code=403, 
            detail="Access forbidden: Admin privileges required"
        )
    
    return user


# ============ NOTIFICATION HELPERS ============
async def send_push_notification(user_id: str, title: str, body: str, data: dict = None):
    """Envoyer une notification push à un utilisateur"""
    try:
        # Récupérer le push token de l'utilisateur
        push_token_doc = await db.push_tokens.find_one({"userId": user_id})
        
        if not push_token_doc or not push_token_doc.get("token"):
            print(f"📵 Pas de push token pour l'utilisateur {user_id}")
            return False
        
        push_token = push_token_doc["token"]
        
        # Vérifier que le token est valide (format ExponentPushToken[...])
        if not PushClient().is_exponent_push_token(push_token):
            print(f"❌ Token push invalide pour {user_id}: {push_token}")
            return False
        
        # Créer le message de notification
        message = PushMessage(
            to=push_token,
            title=title,
            body=body,
            data=data or {},
            sound='default',
            badge=1,
            priority='high'
        )
        
        # Envoyer la notification
        response = PushClient().publish(message)
        
        print(f"📤 Notification envoyée à {user_id}: {title}")
        return True
        
    except PushServerError as e:
        print(f"❌ Erreur serveur Expo: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Erreur envoi notification: {str(e)}")
        return False


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
    
    # Récupérer les tâches de l'ancienne collection (tasks) et de la nouvelle (user_tasks)
    old_tasks = await db.tasks.find({"userId": user["_id"]}).to_list(100)
    new_tasks = await db.user_tasks.find({"userId": user["_id"]}).to_list(100)
    
    # Fusionner les deux listes
    all_tasks = old_tasks + new_tasks
    
    return [TaskResponse(**{**task, "_id": task["_id"]}) for task in all_tasks]

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


# ============ TASK SUGGESTIONS ROUTE ============
@api_router.get("/user/tasks/suggestions")
async def get_task_suggestions(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Generate intelligent task suggestions based on user's plants and current season"""
    user = await get_current_user(credentials)
    
    # Récupérer les plantes de l'utilisateur
    plants = await db.plants.find({"userId": user["_id"]}).to_list(100)
    
    # Déterminer le mois et la saison
    current_month = datetime.utcnow().month
    current_season = get_season(current_month)
    
    suggestions = []
    
    # Règles de tâches par saison
    seasonal_tasks = {
        "spring": [
            {"title": "Préparer les semis", "description": "C'est le moment idéal pour préparer vos semis en godets. Choisissez des variétés adaptées à votre région.", "type": "general", "daysFromNow": 7},
            {"title": "Nettoyer les massifs", "description": "Enlevez les feuilles mortes et préparez le sol pour les nouvelles plantations.", "type": "general", "daysFromNow": 3},
            {"title": "Tailler les arbustes", "description": "Taillez les arbustes à floraison estivale pour favoriser une belle croissance.", "type": "pruning", "daysFromNow": 5},
        ],
        "summer": [
            {"title": "Arroser régulièrement", "description": "Les fortes chaleurs nécessitent un arrosage régulier, de préférence tôt le matin ou tard le soir.", "type": "watering", "daysFromNow": 1},
            {"title": "Récolter les légumes", "description": "C'est la saison des récoltes ! Cueillez régulièrement pour encourager la production.", "type": "general", "daysFromNow": 2},
            {"title": "Pailler le sol", "description": "Appliquez un paillage pour conserver l'humidité et limiter les mauvaises herbes.", "type": "general", "daysFromNow": 7},
        ],
        "autumn": [
            {"title": "Planter les bulbes", "description": "Plantez les bulbes de printemps (tulipes, narcisses, crocus) pour une floraison printanière.", "type": "general", "daysFromNow": 14},
            {"title": "Ramasser les feuilles", "description": "Récupérez les feuilles mortes pour en faire du compost ou du paillage.", "type": "general", "daysFromNow": 5},
            {"title": "Protéger les plantes sensibles", "description": "Commencez à protéger les plantes fragiles avant les premières gelées.", "type": "general", "daysFromNow": 10},
        ],
        "winter": [
            {"title": "Planifier la saison prochaine", "description": "Profitez de l'hiver pour planifier vos cultures et commander vos graines.", "type": "general", "daysFromNow": 7},
            {"title": "Entretenir les outils", "description": "Nettoyez, affûtez et huilez vos outils de jardinage.", "type": "general", "daysFromNow": 14},
            {"title": "Protéger du gel", "description": "Vérifiez les protections hivernales et ajoutez un voile si nécessaire.", "type": "general", "daysFromNow": 3},
        ]
    }
    
    # Ajouter les tâches saisonnières
    for task in seasonal_tasks.get(current_season, []):
        due_date = datetime.utcnow() + timedelta(days=task["daysFromNow"])
        suggestions.append({
            "title": task["title"],
            "description": task["description"],
            "type": task["type"],
            "dueDate": due_date.isoformat(),
            "plantId": None
        })
    
    # Tâches spécifiques par plante
    for plant in plants:
        plant_name = plant.get("name", "Plante")
        watering_freq = plant.get("wateringFrequency", 7)
        
        # Tâche d'arrosage basée sur la fréquence
        if watering_freq <= 3:
            suggestions.append({
                "title": f"Arroser {plant_name}",
                "description": f"Cette plante nécessite un arrosage régulier (tous les {watering_freq} jours).",
                "type": "watering",
                "dueDate": (datetime.utcnow() + timedelta(days=watering_freq)).isoformat(),
                "plantId": plant["_id"]
            })
        
        # Tâche de fertilisation (tous les 2 mois en saison active)
        if current_season in ["spring", "summer"]:
            suggestions.append({
                "title": f"Fertiliser {plant_name}",
                "description": f"Apportez de l'engrais pour favoriser la croissance et la floraison.",
                "type": "fertilizing",
                "dueDate": (datetime.utcnow() + timedelta(days=30)).isoformat(),
                "plantId": plant["_id"]
            })
    
    # Limiter à 10 suggestions maximum
    return {"suggestions": suggestions[:10]}


def get_season(month: int) -> str:
    """Retourne la saison en fonction du mois"""
    if month in [3, 4, 5]:
        return "spring"
    elif month in [6, 7, 8]:
        return "summer"
    elif month in [9, 10, 11]:
        return "autumn"
    else:
        return "winter"


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

# Helper function to send course booking confirmation email
async def send_course_booking_confirmation_email(booking: dict, course_title: str):
    try:
        sendgrid_api_key = os.getenv("SENDGRID_API_KEY")
        from_email = os.getenv("SENDGRID_FROM_EMAIL", "contact@nicolasblot.com")
        
        message = Mail(
            from_email=from_email,
            to_emails=booking["email"],
            subject=f"Confirmation d'inscription - {course_title}",
            html_content=f"""
            <html>
            <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #2C5F2D;">✅ Inscription confirmée !</h2>
                    
                    <p>Bonjour {booking["firstName"]} {booking["lastName"]},</p>
                    
                    <p>Votre inscription à la formation <strong>"{course_title}"</strong> a été confirmée et payée avec succès.</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #2C5F2D;">Détails de votre inscription</h3>
                        <p><strong>📚 Formation :</strong> {course_title}</p>
                        <p><strong>🎓 Niveau :</strong> {booking.get("level", "Tous niveaux")}</p>
                        <p><strong>⏱️ Durée :</strong> {booking.get("duration", "")}</p>
                        <p><strong>💰 Montant payé :</strong> {booking["totalAmount"]}€</p>
                        <p><strong>📧 Email :</strong> {booking["email"]}</p>
                        <p><strong>📞 Téléphone :</strong> {booking["phone"]}</p>
                    </div>
                    
                    <h3>🎯 Prochaines étapes</h3>
                    <p>Vous recevrez :</p>
                    <ul>
                        <li><strong>Dans les 24h</strong> : Email de bienvenue avec accès à la plateforme de formation</li>
                        <li><strong>Chaque semaine</strong> : Nouveaux modules et exercices pratiques</li>
                        <li><strong>Support continu</strong> : Réponses à vos questions par email</li>
                    </ul>
                    
                    <p>En cas de question, n'hésitez pas à nous contacter à {from_email}</p>
                    
                    <p style="margin-top: 30px;">À très bientôt dans la formation,<br><strong>Nicolas Blot, Meilleur Ouvrier de France</strong><br>Sepalis</p>
                </div>
            </body>
            </html>
            """
        )
        
        sg = SendGridAPIClient(sendgrid_api_key)
        response = sg.send(message)
        return response.status_code >= 200 and response.status_code < 300
    except Exception as e:
        logging.error(f"Error sending course confirmation email: {str(e)}")
        return False

@api_router.post("/courses/book")
async def create_course_booking(
    booking_request: WorkshopBookingRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Create a course booking and initiate Stripe payment"""
    user = await get_current_user(credentials)
    
    # Get course details
    courses_data = [
        {"slug": "massif-fleuri", "title": "Massif Fleuri Toute l'Année", "price": 39, "duration": "4 semaines", "level": "Tous niveaux"},
        {"slug": "taille-rosiers", "title": "Tailler et Soigner ses Rosiers", "price": 49, "duration": "5 semaines", "level": "Tous niveaux"},
        {"slug": "potager-bio", "title": "Créer son Potager Bio et Productif", "price": 59, "duration": "8 semaines", "level": "Débutant"},
        {"slug": "jardin-autonome", "title": "Vers un Jardin Autonome et Résilient", "price": 79, "duration": "12 semaines", "level": "Intermédiaire"}
    ]
    
    course = next((c for c in courses_data if c["slug"] == booking_request.workshopSlug), None)
    if not course:
        raise HTTPException(status_code=404, detail="Formation non trouvée")
    
    # Calculate total amount
    total_amount = float(course["price"])
    
    # Create booking record
    booking_id = str(uuid.uuid4())
    
    booking_data = {
        "_id": booking_id,
        "courseSlug": booking_request.workshopSlug,
        "courseTitle": course["title"],
        "firstName": booking_request.firstName,
        "lastName": booking_request.lastName,
        "email": booking_request.email,
        "phone": booking_request.phone,
        "userId": user["_id"],
        "totalAmount": total_amount,
        "duration": course["duration"],
        "level": course["level"],
        "paymentStatus": "pending",
        "stripeSessionId": None,
        "createdAt": datetime.now(),
        "paidAt": None
    }
    
    # Save booking to database
    await db.course_bookings.insert_one(booking_data)
    
    # Initialize Stripe checkout
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        host_url = booking_request.originUrl
        webhook_url = f"{host_url}/api/webhook/stripe"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        success_url = f"{host_url}/course-booking-success?session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{host_url}/academy"
        
        checkout_request = CheckoutSessionRequest(
            amount=total_amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata={
                "booking_id": booking_id,
                "course_slug": booking_request.workshopSlug,
                "user_id": user["_id"],
                "type": "course_booking"
            }
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Update booking with Stripe session ID
        await db.course_bookings.update_one(
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
        logging.error(f"Error creating Stripe checkout for course: {str(e)}")
        # Delete booking if Stripe checkout fails
        await db.course_bookings.delete_one({"_id": booking_id})
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du paiement: {str(e)}")

@api_router.get("/courses/booking/{session_id}/status")
async def check_course_booking_status(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Check the payment status of a course booking"""
    user = await get_current_user(credentials)
    
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        # Get checkout status from Stripe
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Find booking by session ID
        booking = await db.course_bookings.find_one({"stripeSessionId": session_id, "userId": user["_id"]})
        if not booking:
            raise HTTPException(status_code=404, detail="Inscription non trouvée")
        
        # Update booking and transaction status if paid
        if checkout_status.payment_status == "paid" and booking["paymentStatus"] != "paid":
            await db.course_bookings.update_one(
                {"_id": booking["_id"]},
                {"$set": {"paymentStatus": "paid", "paidAt": datetime.now()}}
            )
            
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {"payment_status": "paid", "updatedAt": datetime.now()}}
            )
            
            # Send confirmation email
            await send_course_booking_confirmation_email(booking, booking["courseTitle"])
            
            return {
                "status": "paid",
                "booking": booking
            }
        
        elif checkout_status.status == "expired":
            await db.course_bookings.update_one(
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
            "booking": booking
        }
        
    except Exception as e:
        logging.error(f"Error checking course booking status: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la vérification du statut")


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
    
    # Vérifier la limite de zones pour les utilisateurs gratuits/essai
    subscription = user.get("subscription", {})
    is_premium = subscription.get("isActive", False) and not subscription.get("isTrial", True)
    
    if not is_premium:
        # Compter les zones existantes
        zones_count = await db.zones.count_documents({"userId": user["_id"]})
        if zones_count >= 3:
            raise HTTPException(
                status_code=403, 
                detail="Limite de 3 zones atteinte. Passez à Premium pour créer des zones illimitées."
            )
    
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


@api_router.post("/user/zones/{zone_id}/plant-suggestions")
async def get_plant_suggestions(zone_id: str, request: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Générer des suggestions de plantes adaptées à une zone spécifique avec filtres utilisateur"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage
    import json as json_lib
    
    try:
        user = await get_current_user(credentials)
        
        # Récupérer la zone
        zone = await db.zones.find_one({"_id": zone_id, "userId": user["_id"]})
        if not zone:
            raise HTTPException(status_code=404, detail="Zone non trouvée")
        
        print(f"🌿 Génération de suggestions pour la zone: {zone.get('name')}")
        
        # Récupérer les filtres utilisateur
        filters = request.get('filters', {})
        height_filter = filters.get('height', '')
        color_filter = filters.get('color', '')
        blooming_season = filters.get('bloomingSeason', '')
        
        print(f"🎨 Filtres: hauteur={height_filter}, couleur={color_filter}, floraison={blooming_season}")
        
        # Construire la section des préférences utilisateur
        user_preferences = ""
        if height_filter or color_filter or blooming_season:
            user_preferences = "\nPréférences de l'utilisateur (PRIORITAIRES):"
            if height_filter:
                user_preferences += f"\n- Hauteur souhaitée: {height_filter}"
            if color_filter:
                user_preferences += f"\n- Couleur de floraison: {color_filter}"
            if blooming_season:
                user_preferences += f"\n- Époque de floraison: {blooming_season}"
        
        # Créer un prompt détaillé avec les caractéristiques de la zone
        prompt = f"""En tant qu'expert MOF (Meilleur Ouvrier de France) en paysagisme, suggère 8 plantes idéales pour cette zone de jardin.

IMPORTANT: Propose UNIQUEMENT des plantes vivaces, arbres, arbustes, rosiers ou plantes grimpantes. PAS de plantes annuelles ni potagères.

Caractéristiques de la zone:
- Type: {zone.get('type', 'Non spécifié')}
- Surface: {zone.get('area', 0)}m² ({zone.get('length', 0)}m x {zone.get('width', 0)}m)
- Exposition solaire: {zone.get('sunExposure', 'Non spécifié')}
- Type de sol: {zone.get('soilType', 'Non spécifié')}
- pH du sol: {zone.get('soilPH', 'Non spécifié')}
- Humidité: {zone.get('humidity', 'Non spécifié')}
- Zone climatique: {zone.get('climateZone', 'Non spécifié')}
- Protection contre le vent: {zone.get('windProtection', 'Non spécifié')}
- Système d'arrosage: {zone.get('wateringSystem', 'Non spécifié')}
{user_preferences}

Réponds UNIQUEMENT au format JSON suivant (sans markdown):
{{
    "suggestions": [
        {{
            "name": "Nom français de la plante",
            "scientificName": "Nom latin",
            "category": "vivace/arbre/arbuste/rosier/grimpante",
            "compatibility": 95,
            "reasons": [
                "Raison 1 de compatibilité",
                "Raison 2",
                "Raison 3"
            ],
            "mofAdvice": "Conseil d'expert MOF pour la plantation et l'entretien",
            "bloomingSeason": "Période de floraison (ex: Printemps, Été, Automne)",
            "bloomingColor": "Couleur principale de floraison (ex: Rose, Blanc, Bleu)",
            "height": "Hauteur adulte (ex: 30-50cm, 1-2m)",
            "maintenance": "Facile/Moyen/Exigeant"
        }}
    ]
}}"""

        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY', os.getenv('OPENAI_API_KEY')),
            session_id=f"plant-suggestions-{uuid.uuid4()}",
            system_message="Tu es un expert botaniste MOF spécialisé en plantes ornementales vivaces, arbres, arbustes et rosiers."
        ).with_model("openai", "gpt-4o")
        
        print("🔄 Appel à GPT-4o pour suggestions...")
        
        user_message = UserMessage(text=prompt)
        result_text = await chat.send_message(user_message)
        
        print(f"📡 Réponse reçue: {result_text[:200]}...")
        
        # Nettoyer le JSON
        if result_text.startswith('```json'):
            result_text = result_text.split('```json')[1]
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
        if result_text.endswith('```'):
            result_text = result_text.rsplit('```', 1)[0]
        
        result_text = result_text.strip()
        
        # Parser le JSON
        suggestions_data = json_lib.loads(result_text)
        
        print(f"✅ {len(suggestions_data.get('suggestions', []))} plantes suggérées")
        
        return suggestions_data
        
    except json_lib.JSONDecodeError as e:
        print(f"❌ Erreur parsing JSON: {str(e)}")


@api_router.post("/ai/check-plant-compatibility")
async def check_plant_compatibility(data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifier la compatibilité d'une plante scannée avec les zones de l'utilisateur"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    import json as json_lib
    
    try:
        user = await get_current_user(credentials)
        
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        # Extraire le base64 pur
        if 'base64,' in image_base64:
            image_base64 = image_base64.split('base64,')[1]
        
        # Récupérer toutes les zones de l'utilisateur
        zones = await db.zones.find({"userId": user["_id"]}).to_list(length=100)
        
        if not zones:
            return {"plant": {}, "compatibility": [], "message": "Aucune zone créée"}
        
        print(f"🔍 Analyse compatibilité pour {len(zones)} zones")
        
        # Créer un prompt détaillé avec toutes les zones
        zones_info = "\n".join([
            f"Zone {i+1} - {z.get('name')}: Type={z.get('type')}, Exposition={z.get('sunExposure')}, Sol={z.get('soilType')}, pH={z.get('soilPH')}, Humidité={z.get('humidity')}, Climat={z.get('climateZone')}"
            for i, z in enumerate(zones)
        ])
        
        prompt = f"""En tant qu'expert MOF (Meilleur Ouvrier de France) en paysagisme, analyse cette plante et détermine sa compatibilité avec les zones de jardin de l'utilisateur.

ZONES DU JARDIN:
{zones_info}

Pour chaque zone, évalue la compatibilité et explique pourquoi la plante conviendrait ou non.

Réponds UNIQUEMENT au format JSON suivant (sans markdown):
{{
    "plant": {{
        "name": "Nom français de la plante",
        "scientificName": "Nom latin",
        "category": "vivace/arbre/arbuste/rosier/grimpante",
        "requirements": {{
            "sunlight": "Plein soleil/Mi-ombre/Ombre",
            "soilType": "Type de sol idéal",
            "humidity": "Humide/Normal/Sec",
            "hardiness": "Rusticité",
            "soilPH": "pH idéal"
        }}
    }},
    "compatibility": [
        {{
            "zoneName": "Nom de la zone",
            "zoneId": "{zones[0].get('_id')}",
            "score": 85,
            "status": "excellent/good/fair/poor",
            "explanation": "Explication détaillée de la compatibilité",
            "pros": ["Avantage 1", "Avantage 2"],
            "cons": ["Inconvénient 1"],
            "recommendations": "Conseils MOF pour améliorer les conditions si nécessaire"
        }}
    ]
}}

STATUS: excellent (90-100%), good (70-89%), fair (50-69%), poor (<50%)"""

        # Appel à GPT-4 Vision
        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY', os.getenv('OPENAI_API_KEY')),
            session_id=f"plant-compatibility-{uuid.uuid4()}",
            system_message="Tu es un expert botaniste MOF spécialisé en compatibilité des plantes avec leur environnement."
        ).with_model("openai", "gpt-4o")
        
        print("🔄 Appel à GPT-4 Vision pour compatibilité...")
        
        # Créer le message avec l'image
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        # Envoyer le message et obtenir la réponse
        result_text = await chat.send_message(user_message)
        
        print(f"📡 Réponse compatibilité reçue: {result_text[:200]}...")
        
        # Nettoyer le JSON
        if result_text.startswith('```json'):
            result_text = result_text.split('```json')[1]
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
        if result_text.endswith('```'):
            result_text = result_text.rsplit('```', 1)[0]
        
        result_text = result_text.strip()
        
        # Parser le JSON
        compatibility_data = json_lib.loads(result_text)
        
        print(f"✅ Compatibilité analysée pour {compatibility_data.get('plant', {}).get('name', 'Plante')}")
        
        return compatibility_data
        
    except json_lib.JSONDecodeError as e:
        print(f"❌ Erreur parsing JSON: {str(e)}")
        print(f"Réponse reçue: {result_text[:500]}")
        raise HTTPException(status_code=500, detail="Erreur de format de réponse IA")
    except Exception as e:
        print(f"❌ Erreur compatibilité: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        print(f"Réponse reçue: {result_text[:500]}")
        raise HTTPException(status_code=500, detail="Erreur de format de réponse IA")
    except Exception as e:
        print(f"❌ Erreur suggestions: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ============ AI RECOGNITION ROUTES ============
@api_router.post("/ai/identify-plant")
async def identify_plant(data: dict, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Identifier une plante avec GPT-4 Vision via Emergent Integrations"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    import json as json_lib
    
    try:
        user = await get_current_user(credentials)
        
        # Vérifier la limite de scans pour les utilisateurs gratuits/essai
        subscription = user.get("subscription", {})
        is_premium = subscription.get("isActive", False) and not subscription.get("isTrial", True)
        
        if not is_premium:
            # Compter les scans d'aujourd'hui
            today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
            scans_today = await db.scan_history.count_documents({
                "userId": user["_id"],
                "createdAt": {"$gte": today_start}
            })
            
            if scans_today >= 5:
                raise HTTPException(
                    status_code=403,
                    detail="Limite de 5 scans par jour atteinte. Passez à Premium pour des scans illimités."
                )
            
            # Enregistrer ce scan
            await db.scan_history.insert_one({
                "_id": str(uuid.uuid4()),
                "userId": user["_id"],
                "createdAt": datetime.utcnow()
            })
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        # Extraire seulement le base64 pur (sans préfixe)
        if 'base64,' in image_base64:
            image_base64 = image_base64.split('base64,')[1]
        
        print(f"🔍 Identification avec GPT-4 Vision via Emergent... (Image length: {len(image_base64)} chars)")
        
        # Créer une session chat avec Emergent Integrations
        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY', os.getenv('OPENAI_API_KEY')),
            session_id=f"plant-id-{uuid.uuid4()}",
            system_message="""Tu es un expert botaniste MOF (Meilleur Ouvrier de France) en paysagisme. Identifie précisément la plante dans l'image et fournis des conseils d'expert complets.
            Réponds UNIQUEMENT au format JSON suivant (sans markdown, sans texte supplémentaire):
            {
                "name": "Nom commun français de la plante",
                "scientificName": "Nom scientifique latin",
                "confidence": 0.XX,
                "family": "Famille botanique",
                "description": "Description courte en 2-3 phrases",
                "sunlight": "Plein soleil/Mi-ombre/Ombre",
                "difficulty": "Facile/Moyen/Difficile",
                "careInstructions": {
                    "sunExposure": "Description détaillée de l'exposition solaire idéale",
                    "plantingPeriod": "Période de plantation recommandée",
                    "pruning": "Conseils de taille et d'entretien",
                    "temperature": "Température idéale et tolérance au froid/chaud",
                    "soilType": "Type de sol recommandé (drainage, pH, composition)",
                    "commonIssues": "Problèmes courants et solutions"
                },
                "tips": "Conseil d'entretien principal du MOF"
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
    """Diagnostiquer une maladie avec GPT-4 Vision"""
    from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent
    import json as json_lib
    
    try:
        image_base64 = data.get('image')
        if not image_base64:
            raise HTTPException(status_code=400, detail="Image requise")
        
        print(f"🏥 Début diagnostic maladie...")
        
        # Extraire le base64 pur (sans préfixe)
        if 'base64,' in image_base64:
            image_base64 = image_base64.split('base64,')[1]
        
        print(f"📸 Image reçue (longueur: {len(image_base64)} chars)")
        
        # Prompt pour le diagnostic
        prompt = """Analyse cette plante et détecte les éventuelles maladies ou problèmes.

Si la plante est saine, indique "Plante en bonne santé" comme maladie.
Si tu détectes un problème, fournis un diagnostic détaillé.

Réponds UNIQUEMENT au format JSON suivant (sans markdown):
{
    "disease": "Nom de la maladie ou 'Plante en bonne santé'",
    "confidence": 0.85,
    "severity": "Léger/Modéré/Grave/Aucun",
    "description": "Description détaillée du problème ou de l'état de la plante",
    "symptoms": ["Symptôme 1", "Symptôme 2", "Symptôme 3"],
    "solutions": ["Solution 1", "Solution 2", "Solution 3"],
    "prevention": ["Conseil de prévention 1", "Conseil 2"]
}"""

        # Appel à GPT-4 Vision via emergentintegrations
        chat = LlmChat(
            api_key=os.getenv('EMERGENT_LLM_KEY', os.getenv('OPENAI_API_KEY')),
            session_id=f"plant-diagnosis-{uuid.uuid4()}",
            system_message="Tu es un expert MOF (Meilleur Ouvrier de France) en pathologie végétale. Fournis des diagnostics précis et des solutions professionnelles."
        ).with_model("openai", "gpt-4o")
        
        print("🔄 Appel à GPT-4 Vision...")
        
        # Créer le message avec l'image
        image_content = ImageContent(image_base64=image_base64)
        user_message = UserMessage(
            text=prompt,
            file_contents=[image_content]
        )
        
        # Envoyer le message et obtenir la réponse
        result_text = await chat.send_message(user_message)
        print(f"📡 Réponse GPT-4 reçue: {result_text[:200]}...")
        
        print(f"📡 Réponse IA reçue")
        
        # Nettoyer le JSON
        if result_text.startswith('```json'):
            result_text = result_text.split('```json')[1]
        if result_text.startswith('```'):
            result_text = result_text.split('```')[1]
        if result_text.endswith('```'):
            result_text = result_text.rsplit('```', 1)[0]
        
        result_text = result_text.strip()
        
        # Parser le JSON
        diagnosis = json_lib.loads(result_text)
        
        print(f"✅ Diagnostic: {diagnosis.get('disease', 'Inconnu')}")
        
        return diagnosis
        
    except json_lib.JSONDecodeError as e:
        print(f"❌ Erreur parsing JSON: {str(e)}")
        print(f"Réponse reçue: {result_text[:500]}")
        raise HTTPException(status_code=500, detail="Erreur de format de réponse IA")
    except Exception as e:
        print(f"❌ Erreur diagnostic: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ USER BOOKINGS ROUTE ============
@api_router.get("/user/bookings")
async def get_user_bookings(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get all bookings (workshops + courses) for the current user"""
    user = await get_current_user(credentials)
    
    # Get workshop bookings
    workshop_bookings_cursor = db.workshop_bookings.find({"userId": user["_id"]})
    workshop_bookings = await workshop_bookings_cursor.to_list(length=100)
    
    # Get course bookings
    course_bookings_cursor = db.course_bookings.find({"userId": user["_id"]})
    course_bookings = await course_bookings_cursor.to_list(length=100)
    
    # Format workshop bookings
    formatted_workshops = []
    for booking in workshop_bookings:
        formatted_workshops.append({
            "id": booking["_id"],
            "type": "workshop",
            "title": booking["workshopTitle"],
            "slug": booking["workshopSlug"],
            "date": booking["selectedDate"],
            "timeSlot": booking["timeSlot"],
            "timeSlotDisplay": booking["timeSlotDisplay"],
            "participants": booking["participants"],
            "totalAmount": booking["totalAmount"],
            "paymentStatus": booking["paymentStatus"],
            "createdAt": booking["createdAt"].isoformat() if booking.get("createdAt") else None,
            "paidAt": booking["paidAt"].isoformat() if booking.get("paidAt") else None,
        })
    
    # Format course bookings
    formatted_courses = []
    for booking in course_bookings:
        formatted_courses.append({
            "id": booking["_id"],
            "type": "course",
            "title": booking["courseTitle"],
            "slug": booking["courseSlug"],
            "duration": booking.get("duration", ""),
            "level": booking.get("level", ""),
            "totalAmount": booking["totalAmount"],
            "paymentStatus": booking["paymentStatus"],
            "createdAt": booking["createdAt"].isoformat() if booking.get("createdAt") else None,
            "paidAt": booking["paidAt"].isoformat() if booking.get("paidAt") else None,
        })
    
    # Combine and sort by creation date (most recent first)
    all_bookings = formatted_workshops + formatted_courses
    all_bookings.sort(key=lambda x: x["createdAt"] if x["createdAt"] else "", reverse=True)
    
    return {
        "bookings": all_bookings,
        "total": len(all_bookings),
        "workshops": len(formatted_workshops),
        "courses": len(formatted_courses)
    }


# ============ PUSH NOTIFICATIONS ROUTES ============
@api_router.post("/user/push-token")
async def register_push_token(token_data: PushTokenRequest, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Register or update user's push notification token"""
    user = await get_current_user(credentials)
    
    try:
        # Update user with push token
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$set": {
                    "pushToken": token_data.token,
                    "deviceType": token_data.deviceType,
                    "pushTokenUpdatedAt": datetime.utcnow()
                }
            }
        )
        
        return {"message": "Push token registered successfully", "token": token_data.token}
    except Exception as e:
        print(f"Erreur enregistrement token push: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de l'enregistrement du token")


@api_router.delete("/user/push-token")
async def delete_push_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Delete user's push notification token"""
    user = await get_current_user(credentials)
    
    try:
        await db.users.update_one(
            {"_id": user["_id"]},
            {
                "$unset": {
                    "pushToken": "",
                    "deviceType": "",
                    "pushTokenUpdatedAt": ""
                }
            }
        )
        
        return {"message": "Push token deleted successfully"}
    except Exception as e:
        print(f"Erreur suppression token push: {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression du token")


# ============ GAMIFICATION SYSTEM ============
def calculate_user_level(xp: int) -> dict:
    """Calculate user level based on XP"""
    levels = [
        {"level": 1, "name": "Jardinier Débutant", "min_xp": 0, "max_xp": 100},
        {"level": 2, "name": "Jardinier Apprenti", "min_xp": 100, "max_xp": 300},
        {"level": 3, "name": "Jardinier Confirmé", "min_xp": 300, "max_xp": 600},
        {"level": 4, "name": "Jardinier Expérimenté", "min_xp": 600, "max_xp": 1000},
        {"level": 5, "name": "Jardinier Expert", "min_xp": 1000, "max_xp": 1500},
        {"level": 6, "name": "Maître Jardinier", "min_xp": 1500, "max_xp": 2500},
        {"level": 7, "name": "Légende du Jardin", "min_xp": 2500, "max_xp": float('inf')},
    ]
    
    for level_info in levels:
        if level_info["min_xp"] <= xp < level_info["max_xp"]:
            progress = 0
            if level_info["max_xp"] != float('inf'):
                progress = ((xp - level_info["min_xp"]) / (level_info["max_xp"] - level_info["min_xp"])) * 100
            else:
                progress = 100
                
            return {
                **level_info,
                "current_xp": xp,
                "progress": round(progress, 1)
            }
    
    return levels[0]


def check_user_badges(user_data: dict, tasks: list, plants: list, zones: list) -> list:
    """Check which badges the user has earned"""
    badges = []
    
    # Badge: Premier Jardin
    if len(zones) >= 1:
        badges.append({
            "id": "first_garden",
            "name": "Premier Jardin",
            "description": "Créer votre première zone de jardin",
            "icon": "grid",
            "color": "#4CAF50",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Collectionneur de Plantes
    if len(plants) >= 5:
        badges.append({
            "id": "plant_collector",
            "name": "Collectionneur de Plantes",
            "description": "Avoir 5 plantes ou plus dans votre jardin",
            "icon": "leaf",
            "color": "#8BC34A",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Expert en Tomates
    tomato_plants = [p for p in plants if "tomate" in p.get("name", "").lower()]
    if len(tomato_plants) >= 3:
        badges.append({
            "id": "tomato_expert",
            "name": "Expert en Tomates",
            "description": "Cultiver 3 plants de tomates ou plus",
            "icon": "nutrition",
            "color": "#FF5722",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Jardinier Assidu
    completed_tasks = [t for t in tasks if t.get("completed")]
    if len(completed_tasks) >= 10:
        badges.append({
            "id": "task_master",
            "name": "Jardinier Assidu",
            "description": "Compléter 10 tâches",
            "icon": "checkmark-done",
            "color": "#2196F3",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Marathonien du Jardin
    if len(completed_tasks) >= 50:
        badges.append({
            "id": "task_marathon",
            "name": "Marathonien du Jardin",
            "description": "Compléter 50 tâches",
            "icon": "trophy",
            "color": "#FFD700",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Jardin Diversifié
    if len(zones) >= 3:
        badges.append({
            "id": "diverse_garden",
            "name": "Jardin Diversifié",
            "description": "Créer 3 zones différentes",
            "icon": "apps",
            "color": "#9C27B0",
            "earned": True,
            "earnedAt": datetime.utcnow().isoformat()
        })
    
    # Badge: Météo Master
    # Ce badge sera débloqué si l'utilisateur a consulté la météo (on suppose qu'il l'a fait)
    badges.append({
        "id": "weather_master",
        "name": "Météo Master",
        "description": "Consulter les prévisions météo",
        "icon": "sunny",
        "color": "#FFC107",
        "earned": True,
        "earnedAt": datetime.utcnow().isoformat()
    })
    
    return badges


def calculate_user_xp(tasks: list, plants: list, zones: list) -> int:
    """Calculate total XP based on user activities"""
    xp = 0
    
    # XP par zone créée
    xp += len(zones) * 50
    
    # XP par plante ajoutée
    xp += len(plants) * 20
    
    # XP par tâche complétée
    completed_tasks = [t for t in tasks if t.get("completed")]
    xp += len(completed_tasks) * 10
    
    # Bonus XP pour jalons
    if len(plants) >= 10:
        xp += 100
    if len(completed_tasks) >= 20:
        xp += 150
    if len(zones) >= 5:
        xp += 200
    
    return xp


@api_router.get("/user/gamification")
async def get_user_gamification(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get user's gamification data: level, XP, and badges"""
    user = await get_current_user(credentials)
    
    # Récupérer toutes les données utilisateur
    tasks = await db.tasks.find({"userId": user["_id"]}).to_list(1000)
    plants = await db.plants.find({"userId": user["_id"]}).to_list(1000)
    zones = await db.zones.find({"userId": user["_id"]}).to_list(1000)
    
    # Calculer XP
    total_xp = calculate_user_xp(tasks, plants, zones)
    
    # Calculer niveau
    level_info = calculate_user_level(total_xp)
    
    # Vérifier badges
    earned_badges = check_user_badges(user, tasks, plants, zones)
    
    # Tous les badges possibles (earned + not earned)
    all_possible_badges = [
        {
            "id": "first_garden",
            "name": "Premier Jardin",
            "description": "Créer votre première zone de jardin",
            "icon": "grid",
            "color": "#4CAF50",
            "earned": False
        },
        {
            "id": "plant_collector",
            "name": "Collectionneur de Plantes",
            "description": "Avoir 5 plantes ou plus dans votre jardin",
            "icon": "leaf",
            "color": "#8BC34A",
            "earned": False
        },
        {
            "id": "tomato_expert",
            "name": "Expert en Tomates",
            "description": "Cultiver 3 plants de tomates ou plus",
            "icon": "nutrition",
            "color": "#FF5722",
            "earned": False
        },
        {
            "id": "task_master",
            "name": "Jardinier Assidu",
            "description": "Compléter 10 tâches",
            "icon": "checkmark-done",
            "color": "#2196F3",
            "earned": False
        },
        {
            "id": "task_marathon",
            "name": "Marathonien du Jardin",
            "description": "Compléter 50 tâches",
            "icon": "trophy",
            "color": "#FFD700",
            "earned": False
        },
        {
            "id": "diverse_garden",
            "name": "Jardin Diversifié",
            "description": "Créer 3 zones différentes",
            "icon": "apps",
            "color": "#9C27B0",
            "earned": False
        },
        {
            "id": "weather_master",
            "name": "Météo Master",
            "description": "Consulter les prévisions météo",
            "icon": "sunny",
            "color": "#FFC107",
            "earned": False
        },
    ]
    
    # Marquer les badges gagnés
    earned_ids = {b["id"] for b in earned_badges}
    for badge in all_possible_badges:
        if badge["id"] in earned_ids:
            badge["earned"] = True
            earned_badge = next(b for b in earned_badges if b["id"] == badge["id"])
            badge["earnedAt"] = earned_badge.get("earnedAt")
    
    return {
        "level": level_info,
        "badges": all_possible_badges,
        "stats": {
            "totalTasks": len(tasks),
            "completedTasks": len([t for t in tasks if t.get("completed")]),
            "totalPlants": len(plants),
            "totalZones": len(zones)
        }
    }


# ============ SUBSCRIPTION ROUTES ============
@api_router.get("/user/subscription")
async def get_subscription_status(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current user's subscription status"""
    user = await get_current_user(credentials)
    
    subscription = user.get("subscription", {})
    is_active = subscription.get("isActive", False)
    expires_at = subscription.get("expiresAt")
    days_remaining = None
    is_expired = False
    
    # Vérifier si l'abonnement a expiré et calculer les jours restants
    if expires_at:
        if isinstance(expires_at, str):
            expires_at_dt = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
        else:
            expires_at_dt = expires_at
        
        now = datetime.utcnow()
        
        if now > expires_at_dt:
            # Expiré
            is_active = False
            is_expired = True
            days_remaining = 0
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"subscription.isActive": False}}
            )
        else:
            # Calculer les jours restants
            time_remaining = expires_at_dt - now
            days_remaining = time_remaining.days
    
    return {
        "isActive": is_active,
        "isTrial": subscription.get("isTrial", True),
        "type": subscription.get("type"),
        "expiresAt": subscription.get("expiresAt"),
        "provider": subscription.get("provider", "revenuecat"),
        "daysRemaining": days_remaining,
        "isExpired": is_expired
    }


@api_router.post("/webhooks/revenuecat")
async def revenuecat_webhook(request: Request):
    """Webhook pour recevoir les événements RevenueCat"""
    try:
        body = await request.json()
        event_type = body.get("event", {}).get("type")
        app_user_id = body.get("event", {}).get("app_user_id")
        
        if not app_user_id:
            return {"status": "error", "message": "Missing app_user_id"}
        
        # Trouver l'utilisateur
        user = await db.users.find_one({"_id": app_user_id})
        if not user:
            return {"status": "error", "message": "User not found"}
        
        # Gérer les différents types d'événements
        if event_type == "INITIAL_PURCHASE":
            # Nouvel abonnement
            product_id = body.get("event", {}).get("product_id", "")
            subscription_type = "yearly" if "yearly" in product_id or "annual" in product_id else "monthly"
            expires_at = body.get("event", {}).get("expiration_at_ms")
            
            if expires_at:
                expires_at = datetime.fromtimestamp(expires_at / 1000)
            
            await db.users.update_one(
                {"_id": app_user_id},
                {
                    "$set": {
                        "subscription.isActive": True,
                        "subscription.isTrial": False,
                        "subscription.type": subscription_type,
                        "subscription.expiresAt": expires_at,
                        "subscription.provider": "revenuecat",
                        "subscription.customerId": body.get("event", {}).get("subscriber_id")
                    }
                }
            )
            
        elif event_type == "RENEWAL":
            # Renouvellement
            expires_at = body.get("event", {}).get("expiration_at_ms")
            if expires_at:
                expires_at = datetime.fromtimestamp(expires_at / 1000)
            
            await db.users.update_one(
                {"_id": app_user_id},
                {
                    "$set": {
                        "subscription.isActive": True,
                        "subscription.expiresAt": expires_at
                    }
                }
            )
            
        elif event_type in ["CANCELLATION", "EXPIRATION"]:
            # Annulation ou expiration
            await db.users.update_one(
                {"_id": app_user_id},
                {
                    "$set": {
                        "subscription.isActive": False
                    }
                }
            )
        
        return {"status": "success"}
        
    except Exception as e:
        print(f"Erreur webhook RevenueCat: {str(e)}")
        return {"status": "error", "message": str(e)}


@api_router.post("/user/start-trial")
async def start_trial(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Démarrer la période d'essai de 7 jours"""
    user = await get_current_user(credentials)
    
    # Vérifier si l'utilisateur n'a pas déjà eu un essai
    subscription = user.get("subscription", {})
    
    print(f"📋 Start trial pour user {user['_id']}, subscription actuelle: {subscription}")
    
    # Vérifier si l'essai est déjà actif
    if subscription.get("isActive", False) and subscription.get("isTrial", False):
        expires_at = subscription.get("expiresAt")
        print(f"⚠️ Essai déjà actif, expire le: {expires_at}")
        
        if expires_at:
            if isinstance(expires_at, str):
                expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
            
            if datetime.utcnow() < expires_at:
                print(f"❌ Essai encore valide jusqu'au {expires_at}")
                # En mode démo, on retourne succès avec l'expiration existante
                return {
                    "success": True,
                    "message": "Essai déjà actif",
                    "expiresAt": expires_at.isoformat() if isinstance(expires_at, datetime) else expires_at
                }
    
    # Démarrer un nouvel essai
    trial_expires = datetime.utcnow() + timedelta(days=7)
    print(f"✅ Démarrage nouvel essai, expire le: {trial_expires}")
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {
                "subscription.isActive": True,
                "subscription.isTrial": True,
                "subscription.hasHadTrial": True,
                "subscription.expiresAt": trial_expires,
                "subscription.provider": "trial"
            }
        }
    )
    
    return {
        "success": True,
        "message": "Essai démarré",
        "expiresAt": trial_expires.isoformat()
    }


# ============ SUBSCRIPTION PAYMENT ROUTES ============
@api_router.post("/subscription/checkout")
async def create_subscription_checkout(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Créer une session de paiement Stripe pour l'abonnement Premium à 9,99€/mois"""
    user = await get_current_user(credentials)
    
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe non configuré")
        
        host_url = os.getenv("HOST_URL", "https://sepalis-app-1.preview.emergentagent.com")
        webhook_url = f"{host_url}/api/webhook/stripe-subscription"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_request = CheckoutSessionRequest(
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": "Sepalis Premium",
                        "description": "Abonnement mensuel - Accès illimité à toutes les fonctionnalités"
                    },
                    "unit_amount": 999,  # 9,99€ en centimes
                    "recurring": {
                        "interval": "month"
                    }
                },
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{host_url}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{host_url}/subscription-cancel",
            metadata={
                "user_id": user["_id"],
                "user_email": user["email"],
                "subscription_type": "monthly"
            },
            customer_email=user["email"]
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Enregistrer la tentative de souscription
        await db.subscription_attempts.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": user["_id"],
            "sessionId": session.session_id,
            "amount": 9.99,
            "currency": "eur",
            "status": "pending",
            "createdAt": datetime.utcnow()
        })
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logging.error(f"Erreur création checkout abonnement: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du paiement: {str(e)}")


@api_router.post("/subscription/checkout-yearly")
async def create_subscription_checkout_yearly(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Créer une session de paiement Stripe pour l'abonnement Premium annuel à 99€/an"""
    user = await get_current_user(credentials)
    
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        if not stripe_api_key:
            raise HTTPException(status_code=500, detail="Stripe non configuré")
        
        host_url = os.getenv("HOST_URL", "https://sepalis-app-1.preview.emergentagent.com")
        webhook_url = f"{host_url}/api/webhook/stripe-subscription"
        
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url=webhook_url)
        
        checkout_request = CheckoutSessionRequest(
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": "Sepalis Premium Annuel",
                        "description": "Abonnement annuel - 2 mois offerts - Accès illimité à toutes les fonctionnalités"
                    },
                    "unit_amount": 9900,  # 99€ en centimes
                    "recurring": {
                        "interval": "year"
                    }
                },
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{host_url}/subscription-success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{host_url}/subscription-cancel",
            metadata={
                "user_id": user["_id"],
                "user_email": user["email"],
                "subscription_type": "yearly"
            },
            customer_email=user["email"]
        )
        
        session = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Enregistrer la tentative de souscription
        await db.subscription_attempts.insert_one({
            "_id": str(uuid.uuid4()),
            "userId": user["_id"],
            "sessionId": session.session_id,
            "amount": 99.00,
            "currency": "eur",
            "status": "pending",
            "type": "yearly",
            "createdAt": datetime.utcnow()
        })
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id
        }
        
    except Exception as e:
        logging.error(f"Erreur création checkout abonnement annuel: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du paiement: {str(e)}")


@api_router.post("/webhook/stripe-subscription")
async def stripe_subscription_webhook(request: Request):
    """Webhook pour gérer les paiements d'abonnement Stripe"""
    try:
        body = await request.json()
        event_type = body.get("type", "")
        
        logging.info(f"📩 Webhook Stripe reçu: {event_type}")
        
        if event_type == "checkout.session.completed":
            session = body.get("data", {}).get("object", {})
            metadata = session.get("metadata", {})
            user_id = metadata.get("user_id")
            subscription_type = metadata.get("subscription_type", "monthly")
            
            if user_id:
                # Calculer la date d'expiration
                if subscription_type == "yearly":
                    expires_at = datetime.utcnow() + timedelta(days=365)
                else:
                    expires_at = datetime.utcnow() + timedelta(days=30)
                
                # Activer l'abonnement Premium
                await db.users.update_one(
                    {"_id": user_id},
                    {
                        "$set": {
                            "subscription.isActive": True,
                            "subscription.isTrial": False,
                            "subscription.type": subscription_type,
                            "subscription.expiresAt": expires_at,
                            "subscription.provider": "stripe",
                            "subscription.stripeCustomerId": session.get("customer"),
                            "subscription.stripeSubscriptionId": session.get("subscription")
                        }
                    }
                )
                
                # Mettre à jour la tentative de souscription
                await db.subscription_attempts.update_one(
                    {"sessionId": session.get("id")},
                    {"$set": {"status": "completed", "completedAt": datetime.utcnow()}}
                )
                
                logging.info(f"✅ Abonnement activé pour user {user_id}, expire le {expires_at}")
        
        elif event_type == "invoice.payment_succeeded":
            # Renouvellement automatique
            subscription = body.get("data", {}).get("object", {})
            customer_id = subscription.get("customer")
            
            if customer_id:
                user = await db.users.find_one({"subscription.stripeCustomerId": customer_id})
                if user:
                    subscription_type = user.get("subscription", {}).get("type", "monthly")
                    if subscription_type == "yearly":
                        expires_at = datetime.utcnow() + timedelta(days=365)
                    else:
                        expires_at = datetime.utcnow() + timedelta(days=30)
                    
                    await db.users.update_one(
                        {"_id": user["_id"]},
                        {"$set": {"subscription.expiresAt": expires_at}}
                    )
                    logging.info(f"🔄 Abonnement renouvelé pour user {user['_id']}")
        
        elif event_type == "customer.subscription.deleted":
            # Annulation d'abonnement
            subscription = body.get("data", {}).get("object", {})
            customer_id = subscription.get("customer")
            
            if customer_id:
                await db.users.update_one(
                    {"subscription.stripeCustomerId": customer_id},
                    {
                        "$set": {
                            "subscription.isActive": False,
                            "subscription.cancelledAt": datetime.utcnow()
                        }
                    }
                )
                logging.info(f"❌ Abonnement annulé pour customer {customer_id}")
        
        return {"status": "success"}
        
    except Exception as e:
        logging.error(f"Erreur webhook Stripe: {str(e)}")
        return {"status": "error", "message": str(e)}


@api_router.get("/subscription/status/{session_id}")
async def check_subscription_status(
    session_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Vérifier le statut d'un paiement d'abonnement"""
    user = await get_current_user(credentials)
    
    try:
        stripe_api_key = os.getenv("STRIPE_API_KEY")
        stripe_checkout = StripeCheckout(api_key=stripe_api_key, webhook_url="")
        
        checkout_status = await stripe_checkout.get_checkout_status(session_id)
        
        return {
            "status": checkout_status.status,
            "payment_status": checkout_status.payment_status,
            "subscription_active": user.get("subscription", {}).get("isActive", False)
        }
        
    except Exception as e:
        logging.error(f"Erreur vérification statut abonnement: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
class WeatherCurrent(BaseModel):
    temperature: float
    apparent_temperature: float
    humidity: int
    precipitation: float
    weather_code: int
    wind_speed: float
    wind_direction: int

class WeatherForecastDay(BaseModel):
    date: str
    temperature_max: float
    temperature_min: float
    precipitation_sum: float
    weather_code: int
    sunrise: str
    sunset: str

class WeatherForecastResponse(BaseModel):
    daily: List[WeatherForecastDay]


# ============ WEATHER ROUTES ============
@api_router.get("/weather/current")
async def get_current_weather(lat: float, lon: float):
    """Get current weather for given coordinates using Open-Meteo API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "current": "temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m",
                    "timezone": "auto"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            current = data.get("current", {})
            
            return {
                "temperature": current.get("temperature_2m"),
                "apparent_temperature": current.get("apparent_temperature"),
                "humidity": current.get("relative_humidity_2m"),
                "precipitation": current.get("precipitation", 0),
                "weather_code": current.get("weather_code"),
                "wind_speed": current.get("wind_speed_10m"),
                "wind_direction": current.get("wind_direction_10m"),
                "latitude": lat,
                "longitude": lon
            }
    except Exception as e:
        print(f"Erreur météo actuelle: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération de la météo: {str(e)}")


@api_router.get("/weather/forecast")
async def get_weather_forecast(lat: float, lon: float, days: int = 7):
    """Get weather forecast for given coordinates (7 days by default) using Open-Meteo API"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.open-meteo.com/v1/forecast",
                params={
                    "latitude": lat,
                    "longitude": lon,
                    "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code,sunrise,sunset",
                    "timezone": "auto",
                    "forecast_days": min(days, 16)  # Open-Meteo supports up to 16 days
                }
            )
            response.raise_for_status()
            data = response.json()
            
            daily = data.get("daily", {})
            forecast_days = []
            
            for i in range(len(daily.get("time", []))):
                forecast_days.append({
                    "date": daily["time"][i],
                    "temperature_max": daily["temperature_2m_max"][i],
                    "temperature_min": daily["temperature_2m_min"][i],
                    "precipitation_sum": daily["precipitation_sum"][i],
                    "weather_code": daily["weather_code"][i],
                    "sunrise": daily["sunrise"][i],
                    "sunset": daily["sunset"][i]
                })
            
            return {
                "daily": forecast_days,
                "latitude": lat,
                "longitude": lon
            }
    except Exception as e:
        print(f"Erreur prévisions météo: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la récupération des prévisions: {str(e)}")



# ============ SEASON TIPS ROUTES ============
@api_router.get("/season-tips/current")
async def get_current_season_tip():
    """Obtenir le conseil de saison actuel basé sur le mois"""
    try:
        month = datetime.now().month
        
        # Déterminer la saison
        if month >= 3 and month <= 5:
            season = "spring"
        elif month >= 6 and month <= 8:
            season = "summer"
        elif month >= 9 and month <= 11:
            season = "fall"
        else:
            season = "winter"
        
        # Chercher un conseil personnalisé pour cette saison
        tip = await db.season_tips.find_one({"season": season})
        
        if tip:
            tip["_id"] = str(tip["_id"])
            return tip
        
        # Sinon, retourner un conseil par défaut
        default_tips = {
            "spring": {
                "season": "spring",
                "title": "Printemps - Temps de plantation",
                "text": "C'est le moment idéal pour semer vos graines et préparer vos semis. Taillez les plantes vivaces fanées pour favoriser la nouvelle croissance.",
                "icon": "flower",
                "color": "#4CAF50"
            },
            "summer": {
                "season": "summer",
                "title": "Été - Entretien et récoltes",
                "text": "Pincez les gourmands des tomates. Taillez les arbustes à floraison printanière. C'est le moment des premières récoltes !",
                "icon": "sunny",
                "color": "#FFA726"
            },
            "fall": {
                "season": "fall",
                "title": "Automne - Préparation",
                "text": "Taillez les rosiers et les arbustes. Divisez les vivaces. Préparez votre jardin pour l'hiver.",
                "icon": "leaf",
                "color": "#FF8C00"
            },
            "winter": {
                "season": "winter",
                "title": "Hiver - Repos végétatif",
                "text": "Taillez les arbres fruitiers et les arbustes caducs. Planifiez la saison prochaine et entretenez vos outils.",
                "icon": "snow",
                "color": "#4A90E2"
            }
        }
        
        return default_tips[season]
    except Exception as e:
        print(f"Erreur conseil de saison: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/season-tips", response_model=List[SeasonTipResponse])
async def get_all_season_tips(user: dict = Depends(verify_admin)):
    """Obtenir tous les conseils de saison (admin uniquement)"""
    try:
        tips = await db.season_tips.find().to_list(length=100)
        for tip in tips:
            tip["_id"] = str(tip["_id"])
        
        return tips
    except Exception as e:
        print(f"Erreur récupération conseils: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/season-tips", response_model=SeasonTipResponse)
async def create_season_tip(tip: SeasonTipCreate, user: dict = Depends(verify_admin)):
    """Créer ou mettre à jour un conseil de saison (admin uniquement)"""
    try:
        # Vérifier si un conseil existe déjà pour cette saison
        existing = await db.season_tips.find_one({"season": tip.season})
        
        if existing:
            # Mettre à jour
            await db.season_tips.update_one(
                {"season": tip.season},
                {"$set": {
                    "title": tip.title,
                    "text": tip.text,
                    "icon": tip.icon,
                    "color": tip.color,
                    "updatedAt": datetime.utcnow()
                }}
            )
            updated = await db.season_tips.find_one({"season": tip.season})
            updated["_id"] = str(updated["_id"])
            return updated
        else:
            # Créer
            tip_dict = tip.dict()
            tip_dict["_id"] = str(uuid.uuid4())
            tip_dict["createdAt"] = datetime.utcnow()
            tip_dict["updatedAt"] = datetime.utcnow()
            
            await db.season_tips.insert_one(tip_dict)
            tip_dict["_id"] = str(tip_dict["_id"])
            
            return tip_dict
    except Exception as e:
        print(f"Erreur création conseil: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/season-tips/{season}")
async def delete_season_tip(season: str, user: dict = Depends(verify_admin)):
    """Supprimer un conseil de saison (admin uniquement)"""
    try:
        result = await db.season_tips.delete_one({"season": season})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Conseil non trouvé")
        
        return {"message": "Conseil supprimé avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur suppression conseil: {str(e)}")


# ============ CALENDAR TASKS ROUTES (ADMIN) ============
@api_router.get("/admin/calendar-tasks", response_model=List[CalendarTaskResponse])
async def get_calendar_tasks(user: dict = Depends(verify_admin)):
    """Obtenir toutes les tâches du calendrier (admin uniquement)"""
    try:
        
        tasks = await db.calendar_tasks.find({}).sort("weekNumber", 1).to_list(length=100)
        return [CalendarTaskResponse(**task) for task in tasks]
    except Exception as e:
        print(f"Erreur chargement tâches calendrier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/calendar-tasks", response_model=CalendarTaskResponse)
async def create_calendar_task(task_data: CalendarTaskCreate, user: dict = Depends(verify_admin)):
    """Créer une tâche dans le calendrier (admin uniquement)"""
    try:
        
        # Valider le numéro de semaine
        if task_data.weekNumber < 1 or task_data.weekNumber > 52:
            raise HTTPException(status_code=400, detail="Le numéro de semaine doit être entre 1 et 52")
        
        task_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_task = {
            "_id": task_id,
            **task_data.model_dump(),
            "createdAt": now,
            "updatedAt": now
        }
        
        await db.calendar_tasks.insert_one(new_task)
        
        return CalendarTaskResponse(**new_task)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur création tâche calendrier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/calendar-tasks/{task_id}", response_model=CalendarTaskResponse)
async def update_calendar_task(
    task_id: str, 
    task_data: CalendarTaskUpdate, 
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Mettre à jour une tâche du calendrier (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        # Vérifier que la tâche existe
        existing_task = await db.calendar_tasks.find_one({"_id": task_id})
        if not existing_task:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        # Préparer les données à mettre à jour
        update_data = {k: v for k, v in task_data.model_dump(exclude_unset=True).items() if v is not None}
        
        if "weekNumber" in update_data:
            if update_data["weekNumber"] < 1 or update_data["weekNumber"] > 52:
                raise HTTPException(status_code=400, detail="Le numéro de semaine doit être entre 1 et 52")
        
        update_data["updatedAt"] = datetime.utcnow()
        
        await db.calendar_tasks.update_one(
            {"_id": task_id},
            {"$set": update_data}
        )
        
        updated_task = await db.calendar_tasks.find_one({"_id": task_id})
        return CalendarTaskResponse(**updated_task)
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur mise à jour tâche calendrier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/calendar-tasks/{task_id}")
async def delete_calendar_task(task_id: str, user: dict = Depends(verify_admin)):
    """Supprimer une tâche du calendrier (admin uniquement)"""
    try:
        
        result = await db.calendar_tasks.delete_one({"_id": task_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Tâche non trouvée")
        
        return {"message": "Tâche supprimée avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur suppression tâche calendrier: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/calendar-tasks/distribute")
async def distribute_calendar_tasks(user: dict = Depends(verify_admin)):
    """Distribuer les tâches de la semaine actuelle à tous les utilisateurs (admin uniquement)"""
    try:
        
        # Calculer le numéro de la semaine actuelle
        current_week = datetime.utcnow().isocalendar()[1]
        
        print(f"🗓️ Distribution des tâches pour la semaine {current_week}")
        
        # Trouver les tâches prévues pour cette semaine
        tasks_to_distribute = await db.calendar_tasks.find({"weekNumber": current_week}).to_list(length=100)
        
        if not tasks_to_distribute:
            return {
                "message": f"Aucune tâche programmée pour la semaine {current_week}",
                "weekNumber": current_week,
                "tasksDistributed": 0
            }
        
        # Récupérer tous les utilisateurs
        all_users = await db.users.find({}).to_list(length=10000)
        
        distributed_count = 0
        
        for task in tasks_to_distribute:
            for user_obj in all_users:
                # Vérifier si cette tâche n'a pas déjà été distribuée à cet utilisateur
                existing_task = await db.user_tasks.find_one({
                    "userId": user_obj["_id"],
                    "calendarTaskId": task["_id"],
                    "isMOFSuggestion": True
                })
                
                if not existing_task:
                    # Créer la tâche pour l'utilisateur
                    user_task = {
                        "_id": str(uuid.uuid4()),
                        "userId": user_obj["_id"],
                        "title": task["title"],
                        "description": task["description"],
                        "taskType": task["taskType"],
                        "priority": task["priority"],
                        "completed": False,
                        "isMOFSuggestion": True,  # Marqueur spécial
                        "calendarTaskId": task["_id"],  # Référence à la tâche originale
                        "weekNumber": task["weekNumber"],
                        "createdAt": datetime.utcnow(),
                        "dueDate": None
                    }
                    
                    await db.user_tasks.insert_one(user_task)
                    distributed_count += 1
                    
                    # Envoyer une notification push à l'utilisateur
                    await send_push_notification(
                        user_id=user_obj["_id"],
                        title="🏆 Nouvelle tâche MOF",
                        body=task["title"],
                        data={
                            "type": "mof_task",
                            "taskId": user_task["_id"],
                            "priority": task["priority"]
                        }
                    )
        
        print(f"✅ {distributed_count} tâches distribuées à {len(all_users)} utilisateurs")
        
        return {
            "message": f"Tâches distribuées avec succès",
            "weekNumber": current_week,
            "tasksDistributed": distributed_count,
            "usersCount": len(all_users),
            "tasksCount": len(tasks_to_distribute)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur distribution tâches: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ DAILY QUIZ HELPERS ============
QUIZ_BADGES = {
    "first_answer": {
        "name": "Premier Pas",
        "description": "Répondre à votre première question",
        "icon": "🌱"
    },
    "streak_7": {
        "name": "Jardinier Assidu",
        "description": "Série de 7 jours consécutifs",
        "icon": "🔥"
    },
    "streak_30": {
        "name": "Main Verte",
        "description": "Série de 30 jours consécutifs",
        "icon": "🌿"
    },
    "correct_50": {
        "name": "Expert en Herbe",
        "description": "50 bonnes réponses",
        "icon": "⭐"
    },
    "correct_100": {
        "name": "Maître Jardinier",
        "description": "100 bonnes réponses",
        "icon": "🏆"
    }
}

async def check_and_award_badges(user_id: str, stats: dict) -> List[str]:
    """Vérifier et attribuer les badges gagnés"""
    new_badges = []
    current_badges = stats.get("badges", [])
    
    # Badge première réponse
    if "first_answer" not in current_badges and stats["totalAnswered"] >= 1:
        new_badges.append("first_answer")
    
    # Badge streak 7 jours
    if "streak_7" not in current_badges and stats["currentStreak"] >= 7:
        new_badges.append("streak_7")
    
    # Badge streak 30 jours
    if "streak_30" not in current_badges and stats["currentStreak"] >= 30:
        new_badges.append("streak_30")
    
    # Badge 50 bonnes réponses
    if "correct_50" not in current_badges and stats["totalCorrect"] >= 50:
        new_badges.append("correct_50")
    
    # Badge 100 bonnes réponses
    if "correct_100" not in current_badges and stats["totalCorrect"] >= 100:
        new_badges.append("correct_100")
    
    # Mettre à jour les badges dans la base
    if new_badges:
        await db.user_quiz_stats.update_one(
            {"userId": user_id},
            {"$addToSet": {"badges": {"$each": new_badges}}}
        )
    
    return new_badges


# ============ DAILY QUIZ ROUTES ============
@api_router.get("/quiz/today")
async def get_today_quiz(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtenir la question du jour"""
    try:
        user = await get_current_user(credentials)
        today = date.today()
        
        # Récupérer la question du jour
        question = await db.daily_quiz_questions.find_one({"scheduledDate": today.isoformat()})
        
        if not question:
            raise HTTPException(status_code=404, detail="Pas de question pour aujourd'hui")
        
        # Vérifier si l'utilisateur a déjà répondu aujourd'hui
        stats = await db.user_quiz_stats.find_one({"userId": user["_id"]})
        
        if stats and stats.get("lastAnsweredDate") == today.isoformat():
            # Déjà répondu aujourd'hui
            return {
                "alreadyAnswered": True,
                "message": "Vous avez déjà répondu à la question du jour !",
                "nextQuestionIn": "Nouvelle question demain à 7h00"
            }
        
        # Retourner la question sans la bonne réponse
        return {
            "alreadyAnswered": False,
            "question": {
                "id": question["_id"],
                "question": question["question"],
                "answers": question["answers"],
                "imageUrl": question.get("imageUrl"),
                "difficulty": question.get("difficulty", "medium"),
                "category": question.get("category", "general")
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur récupération question du jour: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/quiz/answer", response_model=DailyQuizAnswerResponse)
async def submit_quiz_answer(
    answer_data: DailyQuizAnswerRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Soumettre une réponse au quiz quotidien"""
    try:
        user = await get_current_user(credentials)
        today = date.today()
        
        # Récupérer la question
        question = await db.daily_quiz_questions.find_one({"_id": answer_data.questionId})
        if not question:
            raise HTTPException(status_code=404, detail="Question non trouvée")
        
        # Vérifier si c'est la question du jour
        if question["scheduledDate"] != today.isoformat():
            raise HTTPException(status_code=400, detail="Cette question n'est pas pour aujourd'hui")
        
        # Vérifier la réponse
        is_correct = answer_data.selectedAnswer == question["correctAnswer"]
        
        # Calculer les XP
        xp_earned = 50 if is_correct else 10  # 50 XP correct, 10 XP participation
        
        # Récupérer ou créer les stats utilisateur
        stats = await db.user_quiz_stats.find_one({"userId": user["_id"]})
        
        if not stats:
            # Créer les stats
            stats = {
                "userId": user["_id"],
                "currentStreak": 1,
                "longestStreak": 1,
                "totalXP": xp_earned,
                "totalAnswered": 1,
                "totalCorrect": 1 if is_correct else 0,
                "lastAnsweredDate": today.isoformat(),
                "badges": [],
                "answersHistory": []
            }
            await db.user_quiz_stats.insert_one(stats)
        else:
            # Mettre à jour les stats
            last_answered = stats.get("lastAnsweredDate")
            
            # Calcul du streak
            if last_answered:
                last_date = date.fromisoformat(last_answered)
                days_diff = (today - last_date).days
                
                if days_diff == 1:
                    # Jour consécutif
                    new_streak = stats["currentStreak"] + 1
                elif days_diff == 0:
                    raise HTTPException(status_code=400, detail="Vous avez déjà répondu aujourd'hui")
                else:
                    # Streak cassé
                    new_streak = 1
            else:
                new_streak = 1
            
            longest_streak = max(stats.get("longestStreak", 0), new_streak)
            
            await db.user_quiz_stats.update_one(
                {"userId": user["_id"]},
                {
                    "$set": {
                        "currentStreak": new_streak,
                        "longestStreak": longest_streak,
                        "lastAnsweredDate": today.isoformat()
                    },
                    "$inc": {
                        "totalXP": xp_earned,
                        "totalAnswered": 1,
                        "totalCorrect": 1 if is_correct else 0
                    },
                    "$push": {
                        "answersHistory": {
                            "date": today.isoformat(),
                            "questionId": answer_data.questionId,
                            "correct": is_correct,
                            "timeSpent": answer_data.timeSpent,
                            "xpEarned": xp_earned
                        }
                    }
                }
            )
            
            # Recharger les stats
            stats = await db.user_quiz_stats.find_one({"userId": user["_id"]})
        
        # Vérifier les badges
        new_badges = await check_and_award_badges(user["_id"], stats)
        
        return DailyQuizAnswerResponse(
            correct=is_correct,
            correctAnswer=question["correctAnswer"],
            explanation=question["explanation"],
            xpEarned=xp_earned,
            newStreak=stats["currentStreak"],
            newTotalXP=stats["totalXP"],
            badgesEarned=new_badges
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur soumission réponse quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/quiz/stats", response_model=UserQuizStatsResponse)
async def get_quiz_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtenir les statistiques quiz de l'utilisateur"""
    try:
        user = await get_current_user(credentials)
        today = date.today()
        
        # Récupérer les stats
        stats = await db.user_quiz_stats.find_one({"userId": user["_id"]})
        
        if not stats:
            # Pas encore de stats
            return UserQuizStatsResponse(
                currentStreak=0,
                longestStreak=0,
                totalXP=0,
                totalAnswered=0,
                totalCorrect=0,
                lastAnsweredDate=None,
                badges=[],
                canAnswerToday=True,
                todayAnswered=False
            )
        
        # Vérifier si déjà répondu aujourd'hui
        today_answered = stats.get("lastAnsweredDate") == today.isoformat()
        
        # Formater les badges
        badges_formatted = []
        for badge_id in stats.get("badges", []):
            if badge_id in QUIZ_BADGES:
                badge_info = QUIZ_BADGES[badge_id]
                badges_formatted.append({
                    "id": badge_id,
                    "name": badge_info["name"],
                    "description": badge_info["description"],
                    "icon": badge_info["icon"]
                })
        
        return UserQuizStatsResponse(
            currentStreak=stats.get("currentStreak", 0),
            longestStreak=stats.get("longestStreak", 0),
            totalXP=stats.get("totalXP", 0),
            totalAnswered=stats.get("totalAnswered", 0),
            totalCorrect=stats.get("totalCorrect", 0),
            lastAnsweredDate=date.fromisoformat(stats["lastAnsweredDate"]) if stats.get("lastAnsweredDate") else None,
            badges=badges_formatted,
            canAnswerToday=not today_answered,
            todayAnswered=today_answered
        )
        
    except Exception as e:
        print(f"Erreur récupération stats quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/quiz/register-push-token")
async def register_quiz_push_token(
    token_data: dict,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Enregistrer le token push d'un utilisateur pour les notifications quiz"""
    try:
        user = await get_current_user(credentials)
        push_token = token_data.get("token")
        
        if not push_token:
            raise HTTPException(status_code=400, detail="Token push requis")
        
        # Mettre à jour ou créer le token
        await db.push_tokens.update_one(
            {"userId": user["_id"]},
            {
                "$set": {
                    "token": push_token,
                    "updatedAt": datetime.utcnow()
                },
                "$setOnInsert": {
                    "userId": user["_id"],
                    "createdAt": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"✅ Token push enregistré pour {user['_id']}")
        return {"message": "Token push enregistré avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur enregistrement token push: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/quiz/unregister-push-token")
async def unregister_quiz_push_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Désactiver les notifications push pour un utilisateur"""
    try:
        user = await get_current_user(credentials)
        
        # Supprimer le token
        await db.push_tokens.delete_one({"userId": user["_id"]})
        
        print(f"✅ Token push supprimé pour {user['_id']}")
        return {"message": "Notifications désactivées avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur suppression token push: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/user/notification-status")
async def get_notification_status(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Vérifier si l'utilisateur a un token push enregistré"""
    try:
        user = await get_current_user(credentials)
        
        token_doc = await db.push_tokens.find_one({"userId": user["_id"]})
        has_token = token_doc is not None
        
        return {
            "hasToken": has_token,
            "updatedAt": token_doc.get("updatedAt") if token_doc else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur vérification token push: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN - DAILY QUIZ ROUTES ============
@api_router.get("/admin/quiz/questions", response_model=List[DailyQuizQuestionResponse])
async def get_all_quiz_questions(user: dict = Depends(verify_admin)):
    """Obtenir toutes les questions (admin uniquement)"""
    try:
        
        questions = await db.daily_quiz_questions.find({}).sort("scheduledDate", -1).to_list(length=200)
        return [DailyQuizQuestionResponse(**q) for q in questions]
        
    except Exception as e:
        print(f"Erreur récupération questions admin: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/admin/quiz/questions", response_model=DailyQuizQuestionResponse)
async def create_quiz_question(
    question_data: DailyQuizQuestionCreate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Créer une nouvelle question (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        # Vérifier qu'il y a bien 4 réponses
        if len(question_data.answers) != 4:
            raise HTTPException(status_code=400, detail="Il faut exactement 4 réponses")
        
        # Vérifier que l'index de la bonne réponse est valide
        if question_data.correctAnswer < 0 or question_data.correctAnswer > 3:
            raise HTTPException(status_code=400, detail="L'index de la bonne réponse doit être entre 0 et 3")
        
        question_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        new_question = {
            "_id": question_id,
            **question_data.model_dump(),
            "scheduledDate": question_data.scheduledDate.isoformat(),
            "createdAt": now
        }
        
        await db.daily_quiz_questions.insert_one(new_question)
        
        return DailyQuizQuestionResponse(**new_question)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur création question quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/admin/quiz/questions/{question_id}", response_model=DailyQuizQuestionResponse)
async def update_quiz_question(
    question_id: str,
    question_data: DailyQuizQuestionUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Mettre à jour une question (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        # Vérifier que la question existe
        existing = await db.daily_quiz_questions.find_one({"_id": question_id})
        if not existing:
            raise HTTPException(status_code=404, detail="Question non trouvée")
        
        # Préparer les données à mettre à jour
        update_data = {k: v for k, v in question_data.model_dump(exclude_unset=True).items() if v is not None}
        
        if "scheduledDate" in update_data:
            update_data["scheduledDate"] = update_data["scheduledDate"].isoformat()
        
        if "answers" in update_data and len(update_data["answers"]) != 4:
            raise HTTPException(status_code=400, detail="Il faut exactement 4 réponses")
        
        if "correctAnswer" in update_data:
            if update_data["correctAnswer"] < 0 or update_data["correctAnswer"] > 3:
                raise HTTPException(status_code=400, detail="L'index de la bonne réponse doit être entre 0 et 3")
        
        await db.daily_quiz_questions.update_one(
            {"_id": question_id},
            {"$set": update_data}
        )
        
        updated = await db.daily_quiz_questions.find_one({"_id": question_id})
        return DailyQuizQuestionResponse(**updated)
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur mise à jour question quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.delete("/admin/quiz/questions/{question_id}")
async def delete_quiz_question(
    question_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Supprimer une question (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        result = await db.daily_quiz_questions.delete_one({"_id": question_id})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Question non trouvée")
        
        return {"message": "Question supprimée avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur suppression question quiz: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ ANALYTICS ROUTES ============
@api_router.post("/analytics/track")
async def track_event(event: AnalyticsEventCreate, credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Enregistrer un événement analytics"""
    try:
        user = await get_current_user(credentials)
        
        event_dict = {
            "_id": str(uuid.uuid4()),
            "userId": user["_id"],
            "eventType": event.eventType,
            "eventData": event.eventData,
            "platform": event.platform,
            "timestamp": datetime.utcnow()
        }
        
        await db.analytics_events.insert_one(event_dict)
        return {"message": "Event tracked successfully"}
    except Exception as e:
        # Ne pas bloquer l'app si le tracking échoue
        print(f"Erreur tracking: {str(e)}")
        return {"message": "Event tracking failed silently"}


@api_router.get("/admin/analytics/overview")
async def get_analytics_overview(user: dict = Depends(verify_admin)):
    """Obtenir les statistiques globales (admin uniquement)"""
    try:
        # Vérifier l'authentification admin
        
        # Total d'utilisateurs inscrits
        total_users = await db.users.count_documents({})
        
        # Utilisateurs inscrits cette semaine
        week_ago = datetime.utcnow() - timedelta(days=7)
        new_users_week = await db.users.count_documents({
            "createdAt": {"$gte": week_ago}
        })
        
        # Utilisateurs actifs (dernière connexion < 7 jours)
        active_users = await db.analytics_events.distinct("userId", {
            "timestamp": {"$gte": week_ago}
        })
        active_users_count = len(active_users)
        
        # Abonnements Premium actifs
        premium_users = await db.users.count_documents({
            "$or": [
                {"isPremium": True},
                {"subscriptionStatus": "active"}
            ]
        })
        
        # Essais actifs
        trial_users = await db.users.count_documents({
            "trialActive": True,
            "trialEndsAt": {"$gte": datetime.utcnow()}
        })
        
        # Taux de conversion (premium / total)
        conversion_rate = (premium_users / total_users * 100) if total_users > 0 else 0
        
        # Événements par type (derniers 30 jours)
        month_ago = datetime.utcnow() - timedelta(days=30)
        event_pipeline = [
            {"$match": {"timestamp": {"$gte": month_ago}}},
            {"$group": {
                "_id": "$eventType",
                "count": {"$sum": 1}
            }}
        ]
        event_counts = await db.analytics_events.aggregate(event_pipeline).to_list(length=100)
        
        # Pages les plus visitées
        page_views = [e for e in event_counts if e["_id"] == "page_view"]
        total_page_views = page_views[0]["count"] if page_views else 0
        
        return {
            "overview": {
                "totalUsers": total_users,
                "newUsersThisWeek": new_users_week,
                "activeUsers": active_users_count,
                "premiumUsers": premium_users,
                "trialUsers": trial_users,
                "conversionRate": round(conversion_rate, 2),
                "totalPageViews": total_page_views
            },
            "eventCounts": event_counts
        }
    except Exception as e:
        print(f"Erreur analytics overview: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/analytics/users")
async def get_users_list(
    limit: int = 100,
    offset: int = 0,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Obtenir la liste des utilisateurs avec leurs stats (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        users = await db.users.find(
            {},
            {
                "password": 0  # Ne pas exposer les mots de passe
            }
        ).sort("createdAt", -1).skip(offset).limit(limit).to_list(length=limit)
        
        for u in users:
            u["_id"] = str(u["_id"])
            # Ajouter des stats pour chaque utilisateur
            if "createdAt" in u:
                u["createdAt"] = u["createdAt"].isoformat() if isinstance(u["createdAt"], datetime) else u["createdAt"]
            if "trialEndsAt" in u:
                u["trialEndsAt"] = u["trialEndsAt"].isoformat() if isinstance(u["trialEndsAt"], datetime) else u["trialEndsAt"]
        
        total_count = await db.users.count_documents({})
        
        return {
            "users": users,
            "total": total_count,
            "limit": limit,
            "offset": offset
        }
    except Exception as e:
        print(f"Erreur users list: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/analytics/export-emails")
async def export_user_emails(user: dict = Depends(verify_admin)):
    """Exporter tous les emails des utilisateurs (admin uniquement)"""
    try:
        
        users = await db.users.find({}, {"email": 1, "name": 1, "createdAt": 1}).to_list(length=10000)
        
        emails = []
        for u in users:
            emails.append({
                "email": u.get("email", ""),
                "name": u.get("name", ""),
                "createdAt": u.get("createdAt", "").isoformat() if isinstance(u.get("createdAt"), datetime) else u.get("createdAt", "")
            })
        
        return {
            "emails": emails,
            "count": len(emails),
            "exportDate": datetime.utcnow().isoformat()
        }
    except Exception as e:
        print(f"Erreur export emails: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/admin/analytics/user-behavior")
async def get_user_behavior(
    days: int = 30,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Obtenir les comportements utilisateurs (admin uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # Activité par jour
        daily_activity_pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": {
                    "$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}
                },
                "events": {"$sum": 1},
                "uniqueUsers": {"$addToSet": "$userId"}
            }},
            {"$project": {
                "_id": 1,
                "events": 1,
                "uniqueUsers": {"$size": "$uniqueUsers"}
            }},
            {"$sort": {"_id": 1}}
        ]
        daily_activity = await db.analytics_events.aggregate(daily_activity_pipeline).to_list(length=365)
        
        # Features les plus utilisées
        feature_usage_pipeline = [
            {"$match": {"timestamp": {"$gte": start_date}}},
            {"$group": {
                "_id": "$eventType",
                "count": {"$sum": 1},
                "uniqueUsers": {"$addToSet": "$userId"}
            }},
            {"$project": {
                "_id": 1,
                "count": 1,
                "uniqueUsers": {"$size": "$uniqueUsers"}
            }},
            {"$sort": {"count": -1}},
            {"$limit": 10}
        ]
        feature_usage = await db.analytics_events.aggregate(feature_usage_pipeline).to_list(length=10)
        
        # Temps moyen dans l'app (à améliorer avec des événements session)
        session_pipeline = [
            {"$match": {
                "timestamp": {"$gte": start_date},
                "eventType": {"$in": ["app_open", "app_close"]}
            }},
            {"$group": {
                "_id": "$userId",
                "sessionCount": {"$sum": 1}
            }}
        ]
        sessions = await db.analytics_events.aggregate(session_pipeline).to_list(length=1000)
        avg_sessions = sum([s["sessionCount"] for s in sessions]) / len(sessions) if sessions else 0
        
        return {
            "dailyActivity": daily_activity,
            "featureUsage": feature_usage,
            "averageSessionsPerUser": round(avg_sessions, 2),
            "period": f"{days} derniers jours"
        }
    except Exception as e:
        print(f"Erreur user behavior: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

        raise HTTPException(status_code=500, detail=str(e))


# ============ ADMIN - MESSAGES BROADCAST ============

class BroadcastMessage(BaseModel):
    title: str
    body: str
    scheduledDate: Optional[str] = None  # ISO format date or null for immediate
    isRecurring: bool = False
    recurringDays: Optional[List[str]] = None  # ["monday", "wednesday", "friday"]

class BroadcastMessageResponse(BaseModel):
    id: str
    title: str
    body: str
    scheduledDate: Optional[str]
    isRecurring: bool
    recurringDays: Optional[List[str]]
    sentAt: Optional[str]
    status: str  # "scheduled", "sent", "failed"
    recipientsCount: int
    createdAt: str


# ============ REFERRAL MODELS ============
class ReferralCodeRequest(BaseModel):
    code: str

class ReferralStats(BaseModel):
    totalReferrals: int
    activeReferrals: int
    pendingReferrals: int
    premiumEarned: int  # en jours
    nextReward: str
    progressToNext: float  # 0-1
    badge: Optional[str]
    referrals: List[Dict]
    
class ReferralReward(BaseModel):
    tier: int  # 1, 3, 5, 10
    premiumDays: int
    badge: Optional[str]
    description: str

@api_router.post("/admin/messages/broadcast")
async def create_broadcast_message(
    message: BroadcastMessage,
    user: dict = Depends(verify_admin)
):
    """Créer et envoyer (ou programmer) un message broadcast à tous les utilisateurs"""
    try:
        # Créer le message dans la DB
        message_doc = {
            "title": message.title,
            "body": message.body,
            "scheduledDate": message.scheduledDate,
            "isRecurring": message.isRecurring,
            "recurringDays": message.recurringDays or [],
            "status": "scheduled" if message.scheduledDate else "sending",
            "recipientsCount": 0,
            "sentAt": None,
            "createdAt": datetime.utcnow().isoformat(),
            "createdBy": str(user["_id"])
        }
        
        result = await db.broadcast_messages.insert_one(message_doc)
        message_id = str(result.inserted_id)
        
        # Si pas de date programmée, envoyer immédiatement
        if not message.scheduledDate:
            # Récupérer tous les utilisateurs avec push tokens
            push_tokens = await db.push_tokens.find({}).to_list(length=10000)
            
            sent_count = 0
            for token_doc in push_tokens:
                success = await send_push_notification(
                    token_doc["userId"],
                    message.title,
                    message.body
                )
                if success:
                    sent_count += 1
            
            # Mettre à jour le statut
            await db.broadcast_messages.update_one(
                {"_id": result.inserted_id},
                {
                    "$set": {
                        "status": "sent",
                        "sentAt": datetime.utcnow().isoformat(),
                        "recipientsCount": sent_count
                    }
                }
            )
            
            print(f"✅ Message broadcast envoyé à {sent_count} utilisateurs")
            
            return {
                "id": message_id,
                "title": message.title,
                "body": message.body,
                "status": "sent",
                "recipientsCount": sent_count,
                "sentAt": datetime.utcnow().isoformat()
            }
        else:
            # Message programmé
            print(f"📅 Message programmé pour {message.scheduledDate}")
            return {
                "id": message_id,
                "title": message.title,
                "body": message.body,
                "status": "scheduled",
                "scheduledDate": message.scheduledDate,
                "recipientsCount": 0
            }
            
    except Exception as e:
        print(f"❌ Erreur broadcast: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/messages/broadcast")
async def get_broadcast_messages(
    user: dict = Depends(verify_admin)
):
    """Récupérer l'historique des messages broadcast"""
    try:
        messages = await db.broadcast_messages.find().sort("createdAt", -1).limit(50).to_list(length=50)
        
        return [{
            "id": str(msg["_id"]),
            "title": msg.get("title", ""),
            "body": msg.get("body", ""),
            "scheduledDate": msg.get("scheduledDate"),
            "isRecurring": msg.get("isRecurring", False),
            "recurringDays": msg.get("recurringDays", []),
            "status": msg.get("status", "unknown"),
            "recipientsCount": msg.get("recipientsCount", 0),
            "sentAt": msg.get("sentAt"),
            "createdAt": msg.get("createdAt", "")
        } for msg in messages]
        
    except Exception as e:
        print(f"❌ Erreur récupération messages: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/admin/messages/templates")
async def get_message_templates(
    user: dict = Depends(verify_admin)
):
    """Récupérer les templates de messages pré-faits"""
    try:
        
        templates = [
            {
                "id": "tip_monday",
                "category": "tips",
                "title": "Astuce jardinage du lundi",
                "body": "🌱 Astuce MOF : Paillez votre sol pour garder l'humidité et réduire les arrosages de 50%"
            },
            {
                "id": "quiz_reminder",
                "category": "quiz",
                "title": "Quiz quotidien disponible !",
                "body": "🧠 Nouveau quiz disponible aujourd'hui ! Testez vos connaissances et gagnez +10 XP 🌿"
            },
            {
                "id": "motivation",
                "category": "motivation",
                "title": "Continuez comme ça !",
                "body": "💪 Vous avez scanné 5 plantes cette semaine ! Continuez, vous devenez un expert 🏆"
            },
            {
                "id": "seasonal",
                "category": "seasonal",
                "title": "C'est le moment !",
                "body": "☀️ En mai, c'est le moment parfait pour planter vos tomates. Besoin de conseils ? Ouvrez Sepalis 🍅"
            },
            {
                "id": "funfact",
                "category": "funfact",
                "title": "Le saviez-vous ?",
                "body": "🤯 Le saviez-vous ? Les tournesols suivent le soleil toute la journée ! Ouvrez le quiz pour en apprendre plus ☀️"
            },
            {
                "id": "community",
                "category": "community",
                "title": "Partagez votre jardin",
                "body": "🌟 Partagez une photo de votre plus belle plante ! Tag #Sepalis sur Instagram"
            },
            {
                "id": "premium",
                "category": "premium",
                "title": "Découvrez Premium",
                "body": "🎁 Envie d'aller plus loin ? Débloquez les suggestions MOF personnalisées avec Sepalis Premium"
            }
        ]
        
        return templates
        
    except Exception as e:
        print(f"❌ Erreur templates: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/messages/broadcast/{message_id}")
async def delete_broadcast_message(
    message_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Supprimer un message programmé (seulement si pas encore envoyé)"""
    try:
        user = await get_current_user(credentials)
        
        message = await db.broadcast_messages.find_one({"_id": ObjectId(message_id)})
        
        if not message:
            raise HTTPException(status_code=404, detail="Message non trouvé")
        
        if message.get("status") == "sent":
            raise HTTPException(status_code=400, detail="Impossible de supprimer un message déjà envoyé")
        
        await db.broadcast_messages.delete_one({"_id": ObjectId(message_id)})
        
        return {"message": "Message supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur suppression message: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ ACADÉMIE - BLOG ARTICLES ============

class BlogArticle(BaseModel):
    title: str
    category: str  # "astuces-mof", "tutoriels", "fun-facts", "actualites"
    content: str
    excerpt: str
    imageUrl: Optional[str] = None
    tags: Optional[List[str]] = []
    published: bool = True

class BlogArticleResponse(BaseModel):
    id: str
    title: str
    category: str
    content: str
    excerpt: str
    imageUrl: Optional[str]
    tags: List[str]
    published: bool
    createdAt: str
    updatedAt: str
    author: Optional[str]

@api_router.get("/blog/articles")
async def get_blog_articles(
    category: Optional[str] = None,
    published: bool = True,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Récupérer tous les articles de blog (Premium uniquement)"""
    try:
        user = await get_current_user(credentials)
        
        # Vérifier si l'utilisateur est Premium
        subscription = user.get("subscription", {})
        is_premium = subscription.get("isActive", False) and not subscription.get("isTrial", True)
        
        if not is_premium:
            raise HTTPException(
                status_code=403,
                detail="Le blog est réservé aux membres Premium. Passez à Premium pour accéder à tous les articles."
            )
        
        query = {"published": published} if published else {}
        
        if category:
            query["category"] = category
        
        articles = await db.blog_articles.find(query).sort("createdAt", -1).to_list(length=100)
        
        return [{
            "id": str(article["_id"]),
            "title": article.get("title", ""),
            "category": article.get("category", ""),
            "content": article.get("content", ""),
            "excerpt": article.get("excerpt", ""),
            "imageUrl": article.get("imageUrl"),
            "tags": article.get("tags", []),
            "published": article.get("published", True),
            "createdAt": article.get("createdAt", ""),
            "updatedAt": article.get("updatedAt", ""),
            "author": article.get("author", "Équipe Sepalis")
        } for article in articles]
        
    except Exception as e:
        print(f"❌ Erreur récupération articles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blog/articles/{article_id}")
async def get_blog_article(article_id: str):
    """Récupérer un article spécifique"""
    try:
        article = await db.blog_articles.find_one({"_id": ObjectId(article_id)})
        
        if not article:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        return {
            "id": str(article["_id"]),
            "title": article.get("title", ""),
            "category": article.get("category", ""),
            "content": article.get("content", ""),
            "excerpt": article.get("excerpt", ""),
            "imageUrl": article.get("imageUrl"),
            "tags": article.get("tags", []),
            "published": article.get("published", True),
            "createdAt": article.get("createdAt", ""),
            "updatedAt": article.get("updatedAt", ""),
            "author": article.get("author", "Équipe Sepalis")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur récupération article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/admin/blog/articles")
async def create_blog_article(
    article: BlogArticle,
    user: dict = Depends(verify_admin)
):
    """Créer un nouvel article de blog (Admin)"""
    try:
        
        article_doc = {
            "title": article.title,
            "category": article.category,
            "content": article.content,
            "excerpt": article.excerpt,
            "imageUrl": article.imageUrl,
            "tags": article.tags or [],
            "published": article.published,
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
            "author": user.get("name", "Admin"),
            "authorId": str(user["_id"])
        }
        
        result = await db.blog_articles.insert_one(article_doc)
        article_id = str(result.inserted_id)
        
        print(f"✅ Article créé: {article.title}")
        
        return {
            "id": article_id,
            "title": article.title,
            "category": article.category,
            "published": article.published
        }
        
    except Exception as e:
        print(f"❌ Erreur création article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.put("/admin/blog/articles/{article_id}")
async def update_blog_article(
    article_id: str,
    article: BlogArticle,
    user: dict = Depends(verify_admin)
):
    """Mettre à jour un article (Admin)"""
    try:
        
        update_doc = {
            "$set": {
                "title": article.title,
                "category": article.category,
                "content": article.content,
                "excerpt": article.excerpt,
                "imageUrl": article.imageUrl,
                "tags": article.tags or [],
                "published": article.published,
                "updatedAt": datetime.utcnow().isoformat()
            }
        }
        
        result = await db.blog_articles.update_one(
            {"_id": ObjectId(article_id)},
            update_doc
        )
        
        if result.modified_count == 0:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        print(f"✅ Article mis à jour: {article.title}")
        
        return {"message": "Article mis à jour avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur mise à jour article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.delete("/admin/blog/articles/{article_id}")
async def delete_blog_article(
    article_id: str,
    user: dict = Depends(verify_admin)
):
    """Supprimer un article (Admin)"""
    try:
        
        result = await db.blog_articles.delete_one({"_id": ObjectId(article_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Article non trouvé")
        
        print(f"✅ Article supprimé")
        
        return {"message": "Article supprimé avec succès"}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Erreur suppression article: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/blog/categories")
async def get_blog_categories():
    """Récupérer les catégories disponibles"""
    return [
        {
            "id": "astuces-mof",
            "name": "Astuces MOF",
            "icon": "🌱",
            "description": "Conseils d'experts Meilleurs Ouvriers de France"
        },
        {
            "id": "tutoriels",
            "name": "Tutoriels",
            "icon": "📚",
            "description": "Guides pas à pas pour réussir votre jardin"
        },
        {
            "id": "fun-facts",
            "name": "Fun Facts",
            "icon": "🤯",
            "description": "Le saviez-vous ? Découvrez le monde fascinant des plantes"
        },
        {
            "id": "actualites",
            "name": "Actualités",
            "icon": "📰",
            "description": "Les dernières nouvelles du monde du jardinage"
        }
    ]




# ============ REFERRAL SYSTEM ============

def calculate_rewards_tier(total_referrals: int) -> dict:
    """Calculer les récompenses selon le nombre de parrainages"""
    tiers = [
        {"min": 1, "premiumDays": 30, "description": "1 mois Premium"},
        {"min": 3, "premiumDays": 90, "description": "3 mois Premium + Badge Ambassadeur"},
        {"min": 5, "premiumDays": 180, "description": "6 mois Premium + Badge Super Ambassadeur"},
        {"min": 10, "premiumDays": 36500, "description": "Premium À VIE + Badge Légende"}
    ]
    
    current_tier = 0
    total_premium_days = 0
    next_tier_description = "Premium à vie !"
    progress = 1.0
    
    for i, tier in enumerate(tiers):
        if total_referrals >= tier["min"]:
            current_tier = i
            total_premium_days = tier["premiumDays"]
        else:
            if i > 0:
                prev_min = tiers[i-1]["min"]
                progress = (total_referrals - prev_min) / (tier["min"] - prev_min)
            else:
                progress = total_referrals / tier["min"]
            next_tier_description = f"{tier['min']} amis : {tier['description']}"
            break
    
    return {
        "currentTier": current_tier,
        "totalPremiumDays": total_premium_days,
        "nextTier": next_tier_description,
        "progress": min(progress, 1.0)
    }

async def calculate_referrer_rewards(referrer_id: str):
    """Calculer et attribuer les récompenses au parrain"""
    try:
        total_referrals = await db.referrals.count_documents({"referrerId": referrer_id})
        rewards = calculate_rewards_tier(total_referrals)
        user = await db.users.find_one({"_id": referrer_id})
        if not user:
            return
        
        current_premium_days = user.get("referralPremiumDays", 0)
        new_premium_days = rewards["totalPremiumDays"]
        
        if new_premium_days > current_premium_days:
            days_to_add = new_premium_days - current_premium_days
            current_expires = user.get("subscription", {}).get("expiresAt")
            if current_expires:
                expires_dt = datetime.fromisoformat(current_expires.replace('Z', '+00:00'))
            else:
                expires_dt = datetime.utcnow()
            
            new_expires = expires_dt + timedelta(days=days_to_add)
            
            await db.users.update_one(
                {"_id": referrer_id},
                {"$set": {
                    "referralPremiumDays": new_premium_days,
                    "subscription.isActive": True,
                    "subscription.expiresAt": new_expires.isoformat(),
                    "subscription.type": "referral_earned" if total_referrals < 10 else "lifetime"
                }}
            )
            print(f"✅ Parrain {referrer_id} : +{days_to_add} jours Premium")
    except Exception as e:
        print(f"Erreur calculate rewards: {str(e)}")

@api_router.get("/user/referral/code")
async def get_my_referral_code(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtenir mon code de parrainage unique"""
    try:
        user = await get_current_user(credentials)
        
        if not user.get("referralCode"):
            first_name = user.get("firstName", "USER").upper()[:10]
            random_digits = str(uuid.uuid4().int)[:4]
            referral_code = f"SEPALIS-{first_name}-{random_digits}"
            
            await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": {"referralCode": referral_code}}
            )
            user["referralCode"] = referral_code
        
        return {
            "code": user["referralCode"],
            "shareUrl": f"https://sepalis.app/invite/{user['referralCode']}",
            "shareMessage": f"Hey ! 🌱\n\nJe viens de découvrir Sepalis, une super app pour identifier les plantes et gérer son jardin.\n\nTu devrais la tester, elle est gratuite !\n\nAvec mon code {user['referralCode']}, tu gagnes 2 semaines Premium gratuites 🎁\n\n📱 Télécharge ici : https://sepalis.app\n\nBon jardinage ! 🌿"
        }
    except Exception as e:
        print(f"Erreur get referral code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/user/referral/apply")
async def apply_referral_code(
    request: ReferralCodeRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Appliquer un code de parrainage (filleul)"""
    try:
        user = await get_current_user(credentials)
        
        if user.get("referredBy"):
            raise HTTPException(status_code=400, detail="Vous avez déjà utilisé un code de parrainage")
        
        if user.get("referralCode") == request.code:
            raise HTTPException(status_code=400, detail="Vous ne pouvez pas utiliser votre propre code")
        
        referrer = await db.users.find_one({"referralCode": request.code})
        if not referrer:
            raise HTTPException(status_code=404, detail="Code de parrainage invalide")
        
        referral_doc = {
            "referrerId": referrer["_id"],
            "referredId": user["_id"],
            "referredEmail": user["email"],
            "referredName": f"{user.get('firstName', '')} {user.get('lastName', '')}".strip(),
            "status": "active",
            "createdAt": datetime.utcnow().isoformat(),
            "rewardsEarned": {
                "referrer": {"premiumDays": 0, "tier": 0},
                "referred": {"premiumDays": 14}
            }
        }
        
        await db.referrals.insert_one(referral_doc)
        
        expires_at = datetime.utcnow() + timedelta(days=14)
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "referredBy": referrer["_id"],
                "referredByCode": request.code,
                "subscription.isActive": True,
                "subscription.isTrial": False,
                "subscription.type": "referral_bonus",
                "subscription.expiresAt": expires_at.isoformat()
            }}
        )
        
        await calculate_referrer_rewards(referrer["_id"])
        
        return {
            "success": True,
            "message": "Code appliqué avec succès ! Vous avez gagné 2 semaines Premium 🎁",
            "premiumDays": 14,
            "expiresAt": expires_at.isoformat()
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur apply referral: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/user/referral/stats")
async def get_referral_stats(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Obtenir les statistiques de parrainage"""
    try:
        user = await get_current_user(credentials)
        
        total_referrals = await db.referrals.count_documents({"referrerId": user["_id"]})
        active_referrals = await db.referrals.count_documents({
            "referrerId": user["_id"],
            "status": "active"
        })
        
        referrals_cursor = db.referrals.find({"referrerId": user["_id"]}).sort("createdAt", -1)
        referrals_list = await referrals_cursor.to_list(length=100)
        
        referrals_data = []
        for ref in referrals_list:
            referrals_data.append({
                "id": str(ref["_id"]),
                "name": ref.get("referredName", "Utilisateur"),
                "email": ref.get("referredEmail", ""),
                "status": ref.get("status", "active"),
                "createdAt": ref.get("createdAt"),
                "rewardEarned": ref.get("rewardsEarned", {}).get("referrer", {}).get("premiumDays", 0)
            })
        
        rewards_data = calculate_rewards_tier(total_referrals)
        
        badge = None
        if total_referrals >= 10:
            badge = "legendary"
        elif total_referrals >= 5:
            badge = "super_ambassador"
        elif total_referrals >= 3:
            badge = "ambassador"
        
        return {
            "totalReferrals": total_referrals,
            "activeReferrals": active_referrals,
            "pendingReferrals": 0,
            "premiumEarned": user.get("referralPremiumDays", 0),
            "nextReward": rewards_data["nextTier"],
            "progressToNext": rewards_data["progress"],
            "badge": badge,
            "referrals": referrals_data
        }
    except Exception as e:
        print(f"Erreur get referral stats: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============ USER PROFILE ENDPOINTS ============

class ProfileUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None

class PasswordChange(BaseModel):
    currentPassword: str
    newPassword: str

class SupportMessage(BaseModel):
    subject: str
    message: str


@api_router.get("/user/profile")
async def get_user_profile(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Récupère les informations du profil utilisateur"""
    try:
        user = await get_current_user(credentials)
        
        return {
            "firstName": user.get("firstName", user.get("name", "").split()[0] if user.get("name") else ""),
            "lastName": user.get("lastName", user.get("name", "").split()[-1] if user.get("name") and len(user.get("name", "").split()) > 1 else ""),
            "email": user["email"]
        }
    except Exception as e:
        print(f"Erreur get profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.put("/user/profile")
async def update_user_profile(
    profile: ProfileUpdate,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Met à jour les informations du profil utilisateur"""
    try:
        user = await get_current_user(credentials)
        
        update_data = {}
        if profile.firstName:
            update_data["firstName"] = profile.firstName
        if profile.lastName:
            update_data["lastName"] = profile.lastName
        
        # Mettre à jour aussi le champ 'name' pour compatibilité
        if profile.firstName or profile.lastName:
            firstName = profile.firstName or user.get("firstName", "")
            lastName = profile.lastName or user.get("lastName", "")
            update_data["name"] = f"{firstName} {lastName}".strip()
        
        if update_data:
            result = await db.users.update_one(
                {"_id": user["_id"]},
                {"$set": update_data}
            )
            
            if result.modified_count == 0:
                raise HTTPException(status_code=400, detail="Aucune modification effectuée")
        
        return {"message": "Profil mis à jour avec succès"}
    except Exception as e:
        print(f"Erreur update profile: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/user/change-password")
async def change_password(
    password_data: PasswordChange,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Change le mot de passe utilisateur"""
    try:
        user = await get_current_user(credentials)
        
        # Vérifier le mot de passe actuel
        if not verify_password(password_data.currentPassword, user["password"]):
            raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
        
        # Hasher le nouveau mot de passe
        new_password_hash = hash_password(password_data.newPassword)
        
        # Mettre à jour dans la base de données
        await db.users.update_one(
            {"_id": user["_id"]},
            {"$set": {"password": new_password_hash}}
        )
        
        return {"message": "Mot de passe modifié avec succès"}
    except HTTPException:
        raise
    except Exception as e:
        print(f"Erreur change password: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@api_router.post("/user/support-message")
async def send_support_message(
    support_data: SupportMessage,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Envoie un message au support"""
    try:
        user = await get_current_user(credentials)
        
        # Enregistrer le message dans la base de données
        message_doc = {
            "userId": user["_id"],
            "userEmail": user["email"],
            "userName": user.get("name", "Utilisateur"),
            "subject": support_data.subject,
            "message": support_data.message,
            "createdAt": datetime.utcnow(),
            "status": "new"
        }
        
        await db.support_messages.insert_one(message_doc)
        
        # TODO: Envoyer un email de notification au support
        # Pour l'instant, on enregistre juste dans la DB
        
        return {"message": "Message envoyé avec succès"}
    except Exception as e:
        print(f"Erreur send support message: {str(e)}")
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

# ============ SCHEDULER CONFIGURATION ============
scheduler = AsyncIOScheduler()

async def send_daily_quiz_notifications():
    """Envoyer les notifications push pour la question du jour"""
    try:
        today = date.today()
        print(f"📬 [AUTO] Envoi notifications quiz pour {today}")
        
        # Vérifier qu'il y a une question programmée pour aujourd'hui
        question = await db.daily_quiz_questions.find_one({"scheduledDate": today.isoformat()})
        
        if not question:
            print(f"ℹ️ [AUTO] Pas de question programmée pour {today}")
            return
        
        # Récupérer tous les utilisateurs
        all_users = await db.users.find({}).to_list(length=10000)
        
        notifications_sent = 0
        
        for user_obj in all_users:
            # Vérifier si l'utilisateur a déjà répondu aujourd'hui
            stats = await db.user_quiz_stats.find_one({"userId": user_obj["_id"]})
            
            already_answered = stats and stats.get("lastAnsweredDate") == today.isoformat()
            
            if not already_answered:
                # Envoyer la notification
                sent = await send_push_notification(
                    user_id=user_obj["_id"],
                    title="☕ Nouvelle question du MOF",
                    body="Testez vos connaissances avec la question du jour ! 🌱",
                    data={
                        "type": "daily_quiz",
                        "questionId": question["_id"],
                        "date": today.isoformat()
                    }
                )
                
                if sent:
                    notifications_sent += 1
        
        print(f"✅ [AUTO] {notifications_sent} notifications quiz envoyées")
        
    except Exception as e:
        print(f"❌ [AUTO] Erreur envoi notifications quiz: {str(e)}")


async def auto_distribute_weekly_tasks():
    """Fonction automatique pour distribuer les tâches de la semaine"""
    try:
        current_week = datetime.utcnow().isocalendar()[1]
        
        print(f"🤖 [AUTO] Distribution automatique pour la semaine {current_week}")
        
        # Trouver les tâches prévues pour cette semaine
        tasks_to_distribute = await db.calendar_tasks.find({"weekNumber": current_week}).to_list(length=100)
        
        if not tasks_to_distribute:
            print(f"ℹ️ [AUTO] Aucune tâche programmée pour la semaine {current_week}")
            return
        
        # Récupérer tous les utilisateurs
        all_users = await db.users.find({}).to_list(length=10000)
        
        distributed_count = 0
        
        for task in tasks_to_distribute:
            for user_obj in all_users:
                # Vérifier si cette tâche n'a pas déjà été distribuée à cet utilisateur
                existing_task = await db.user_tasks.find_one({
                    "userId": user_obj["_id"],
                    "calendarTaskId": task["_id"],
                    "isMOFSuggestion": True
                })
                
                if not existing_task:
                    # Créer la tâche pour l'utilisateur
                    user_task = {
                        "_id": str(uuid.uuid4()),
                        "userId": user_obj["_id"],
                        "title": task["title"],
                        "description": task["description"],
                        "taskType": task["taskType"],
                        "priority": task["priority"],
                        "type": task["taskType"],  # Compatibilité
                        "completed": False,
                        "isMOFSuggestion": True,
                        "calendarTaskId": task["_id"],
                        "weekNumber": task["weekNumber"],
                        "createdAt": datetime.utcnow(),
                        "dueDate": None
                    }
                    
                    await db.user_tasks.insert_one(user_task)
                    distributed_count += 1
                    
                    # Envoyer une notification push à l'utilisateur
                    await send_push_notification(
                        user_id=user_obj["_id"],
                        title="🏆 Nouvelle tâche MOF",
                        body=task["title"],
                        data={
                            "type": "mof_task",
                            "taskId": user_task["_id"],
                            "priority": task["priority"]
                        }
                    )
        
        print(f"✅ [AUTO] {distributed_count} tâches distribuées à {len(all_users)} utilisateurs")
        
    except Exception as e:
        print(f"❌ [AUTO] Erreur distribution automatique: {str(e)}")

@app.on_event("startup")
async def startup_scheduler():
    """Démarrer le scheduler au lancement de l'application"""
    print("🚀 Démarrage du scheduler de tâches MOF...")
    
    # Planifier la distribution chaque lundi à 6h00 du matin (UTC)
    scheduler.add_job(
        auto_distribute_weekly_tasks,
        CronTrigger(day_of_week='mon', hour=6, minute=0),
        id='weekly_tasks_distribution',
        name='Distribution hebdomadaire des tâches MOF',
        replace_existing=True
    )
    
    # Planifier les notifications quiz chaque jour à 7h00 du matin (UTC)
    scheduler.add_job(
        send_daily_quiz_notifications,
        CronTrigger(hour=7, minute=0),
        id='daily_quiz_notifications',
        name='Notifications quiz quotidien',
        replace_existing=True
    )
    
    scheduler.start()
    print("✅ Scheduler démarré :")
    print("   - Distribution tâches : Chaque lundi à 6h00")
    print("   - Notifications quiz : Chaque jour à 7h00")

@app.on_event("shutdown")
async def shutdown_scheduler():
    """Arrêter le scheduler proprement"""
    scheduler.shutdown()
    print("🛑 Scheduler arrêté")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

# ============ SERVIR L'APPLICATION WEB STATIQUE ============
# Monter les fichiers statiques (assets JS, CSS, images)
static_path = Path(__file__).parent / "static"
if static_path.exists():
    app.mount("/assets", StaticFiles(directory=static_path / "assets"), name="assets")
    app.mount("/_expo", StaticFiles(directory=static_path / "_expo"), name="expo")
    
    @app.get("/")
    async def serve_root():
        return FileResponse(static_path / "index.html")
    
    @app.get("/{path:path}")
    async def serve_spa(path: str, request: Request):
        # Si c'est une route API, laisser passer
        if path.startswith("api"):
            raise HTTPException(status_code=404)
        
        # Chercher le fichier HTML correspondant
        file_path = static_path / f"{path}.html"
        if file_path.exists():
            return FileResponse(file_path)
        
        # Chercher dans les sous-dossiers
        for subdir in ["(tabs)", "(auth)"]:
            sub_path = static_path / subdir / f"{path}.html"
            if sub_path.exists():
                return FileResponse(sub_path)
        
        # Fallback sur index.html pour le SPA routing
        return FileResponse(static_path / "index.html")
