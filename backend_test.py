#!/usr/bin/env python3
"""
Tests complets du backend Sepalis avant déploiement App Store/Play Store
Application de jardinage avec IA - Backend FastAPI

Tests critiques selon la demande d'analyse:
1. Authentification & Sécurité (JWT, routes admin)
2. Système d'abonnement (essai gratuit, limitations)
3. CRUD Zones, Plantes, Tâches
4. API Météo
5. Contenu (Formations/Ateliers)
6. Quiz quotidien
7. Système de parrainage
8. Profil utilisateur
9. Health check
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BACKEND_URL = "https://sepalis-app-1.preview.emergentagent.com/api"
TIMEOUT = 10

class SepalisBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.auth_token = None
        self.admin_token = None
        self.user_id = None
        self.admin_user_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details="", response_time=0):
        """Enregistrer le résultat d'un test"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "response_time": f"{response_time:.3f}s"
        })
        print(f"{status} {test_name} ({response_time:.3f}s)")
        if details and not success:
            print(f"   └─ {details}")
    
    def make_request(self, method, endpoint, **kwargs):
        """Faire une requête HTTP avec gestion d'erreur"""
        url = f"{BACKEND_URL}{endpoint}"
        start_time = time.time()
        
        try:
            if self.auth_token and 'headers' not in kwargs:
                kwargs['headers'] = {'Authorization': f'Bearer {self.auth_token}'}
            elif self.auth_token and 'headers' in kwargs:
                kwargs['headers']['Authorization'] = f'Bearer {self.auth_token}'
                
            response = self.session.request(method, url, **kwargs)
            response_time = time.time() - start_time
            return response, response_time
        except Exception as e:
            response_time = time.time() - start_time
            return None, response_time
    
    def test_health_check(self):
        """Test 11: Health check - Vérifier que l'API répond via /courses"""
        print("\n🏥 TEST HEALTH CHECK")
        
        # Utiliser /courses comme health check car /health n'existe pas
        response, response_time = self.make_request('GET', '/courses')
        
        if response and response.status_code == 200:
            self.log_test("Health Check API (via /courses)", True, "API répond correctement", response_time)
            return True
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Health Check API (via /courses)", False, error_msg, response_time)
            return False
    
    def test_authentication(self):
        """Test 1: Authentification & Sécurité"""
        print("\n🔐 TEST AUTHENTIFICATION & SÉCURITÉ")
        
        # Test inscription
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPassword123!"
        test_name = "Test User"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "name": test_name
        }
        
        response, response_time = self.make_request('POST', '/auth/register', json=register_data)
        
        if response and response.status_code == 200:
            data = response.json()
            self.auth_token = data.get('token')
            self.user_id = data.get('user', {}).get('id')
            self.log_test("POST /api/auth/register", True, "Inscription réussie", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/auth/register", False, error_msg, response_time)
            return False
        
        # Test connexion
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        response, response_time = self.make_request('POST', '/auth/login', json=login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            token = data.get('token')
            self.log_test("POST /api/auth/login", True, "Connexion réussie", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/auth/login", False, error_msg, response_time)
        
        # Test protection JWT sur endpoint protégé
        response, response_time = self.make_request('GET', '/user/profile')
        
        if response and response.status_code == 200:
            self.log_test("Protection JWT endpoints", True, "Accès autorisé avec token valide", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("Protection JWT endpoints", False, error_msg, response_time)
        
        # Test accès sans token
        old_token = self.auth_token
        self.auth_token = None
        response, response_time = self.make_request('GET', '/user/profile')
        self.auth_token = old_token
        
        if response and response.status_code == 401:
            self.log_test("Protection JWT - Accès refusé sans token", True, "401 Unauthorized comme attendu", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'} - Devrait être 401"
            self.log_test("Protection JWT - Accès refusé sans token", False, error_msg, response_time)
        
        return True
    
    def test_admin_security(self):
        """Test protection des routes admin"""
        print("\n🛡️ TEST SÉCURITÉ ROUTES ADMIN")
        
        admin_routes = [
            '/admin/season-tips',
            '/admin/calendar-tasks', 
            '/admin/quiz/questions',
            '/admin/analytics/overview',
            '/admin/messages/broadcast',
            '/admin/blog/articles'
        ]
        
        all_protected = True
        
        for route in admin_routes:
            response, response_time = self.make_request('GET', route)
            
            if response and response.status_code == 403:
                self.log_test(f"Protection route {route}", True, "403 Forbidden pour utilisateur normal", response_time)
            else:
                error_msg = f"Status: {response.status_code if response else 'No response'} - Devrait être 403"
                self.log_test(f"Protection route {route}", False, error_msg, response_time)
                all_protected = False
        
        return all_protected
    
    def test_subscription_system(self):
        """Test 2: Système d'abonnement"""
        print("\n💳 TEST SYSTÈME D'ABONNEMENT")
        
        # Test démarrage essai gratuit
        response, response_time = self.make_request('POST', '/user/start-trial')
        
        if response and response.status_code == 200:
            data = response.json()
            self.log_test("POST /api/user/start-trial", True, "Essai gratuit démarré", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/user/start-trial", False, error_msg, response_time)
        
        # Test vérification statut abonnement
        response, response_time = self.make_request('GET', '/user/subscription')
        
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ['isActive', 'isTrial', 'daysRemaining', 'isExpired']
            has_all_fields = all(field in data for field in required_fields)
            
            if has_all_fields:
                details = f"Statut: {data.get('isActive')}, Trial: {data.get('isTrial')}, Jours restants: {data.get('daysRemaining')}"
                self.log_test("GET /api/user/subscription", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in data]
                self.log_test("GET /api/user/subscription", False, f"Champs manquants: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/subscription", False, error_msg, response_time)
        
        return True
    
    def test_zones_crud(self):
        """Test 3: CRUD Zones"""
        print("\n🏡 TEST CRUD ZONES")
        
        # Test récupération zones (vide initialement)
        response, response_time = self.make_request('GET', '/user/zones')
        
        if response and response.status_code == 200:
            zones = response.json()
            self.log_test("GET /api/user/zones", True, f"Récupéré {len(zones)} zones", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/zones", False, error_msg, response_time)
            return False
        
        # Test création zone avec champ humidity
        zone_data = {
            "name": "Zone Test Potager",
            "type": "vegetable",
            "length": 5.0,
            "width": 3.0,
            "area": 15.0,
            "soilType": "Argileux",
            "soilPH": "Neutre (6.5-7)",
            "humidity": "Normal",  # Champ critique après fix
            "sunExposure": "Plein soleil",
            "climateZone": "Tempéré océanique",
            "windProtection": "Protégé",
            "wateringSystem": "Arrosage manuel",
            "notes": "Zone test pour les légumes",
            "color": "#4CAF50"
        }
        
        response, response_time = self.make_request('POST', '/user/zones', json=zone_data)
        
        if response and response.status_code == 200:
            zone = response.json()
            zone_id = zone.get('_id')  # Use _id instead of id
            self.log_test("POST /api/user/zones", True, f"Zone créée avec humidity: {zone.get('humidity')}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            if response:
                error_msg += f" - {response.text}"
            self.log_test("POST /api/user/zones", False, error_msg, response_time)
            return False
        
        # Test récupération zone par ID
        response, response_time = self.make_request('GET', f'/user/zones/{zone_id}')
        
        if response and response.status_code == 200:
            zone_detail = response.json()
            self.log_test("GET /api/user/zones/{id}", True, f"Zone récupérée: {zone_detail.get('name')}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/zones/{id}", False, error_msg, response_time)
        
        # Test mise à jour zone
        update_data = {**zone_data, "humidity": "Humide", "notes": "Zone mise à jour"}
        response, response_time = self.make_request('PUT', f'/user/zones/{zone_id}', json=update_data)
        
        if response and response.status_code == 200:
            updated_zone = response.json()
            self.log_test("PUT /api/user/zones/{id}", True, f"Humidity mis à jour: {updated_zone.get('humidity')}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("PUT /api/user/zones/{id}", False, error_msg, response_time)
        
        # Test suppression zone
        response, response_time = self.make_request('DELETE', f'/user/zones/{zone_id}')
        
        if response and response.status_code == 200:
            self.log_test("DELETE /api/user/zones/{id}", True, "Zone supprimée avec succès", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("DELETE /api/user/zones/{id}", False, error_msg, response_time)
        
        return True
    
    def test_plants_crud(self):
        """Test 4: CRUD Plantes"""
        print("\n🌱 TEST CRUD PLANTES")
        
        # Test récupération plantes
        response, response_time = self.make_request('GET', '/user/plants')
        
        if response and response.status_code == 200:
            plants = response.json()
            self.log_test("GET /api/user/plants", True, f"Récupéré {len(plants)} plantes", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/plants", False, error_msg, response_time)
            return False
        
        # Test création plante avec conseils MOF
        plant_data = {
            "name": "Rosier Pierre de Ronsard",
            "scientificName": "Rosa 'Pierre de Ronsard'",
            "description": "Magnifique rosier grimpant aux fleurs blanc rosé",
            "careInstructions": {
                "sunExposure": "Plein soleil à mi-ombre",
                "plantingPeriod": "Automne ou début de printemps",
                "pruning": "Taille légère en fin d'hiver",
                "temperature": "Rustique jusqu'à -15°C",
                "soilType": "Sol riche, bien drainé",
                "commonIssues": "Surveiller pucerons et maladies cryptogamiques"
            },
            "isFavorite": False
        }
        
        response, response_time = self.make_request('POST', '/user/plants', json=plant_data)
        
        if response and response.status_code == 200:
            plant = response.json()
            plant_id = plant.get('_id')  # Use _id instead of id
            care_instructions = plant.get('careInstructions', {})
            self.log_test("POST /api/user/plants", True, f"Plante créée avec conseils MOF: {len(care_instructions)} champs", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/user/plants", False, error_msg, response_time)
            return False
        
        # Test suppression plante
        response, response_time = self.make_request('DELETE', f'/user/plants/{plant_id}')
        
        if response and response.status_code == 200:
            self.log_test("DELETE /api/user/plants/{id}", True, "Plante supprimée avec succès", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("DELETE /api/user/plants/{id}", False, error_msg, response_time)
        
        return True
    
    def test_tasks_crud(self):
        """Test 5: CRUD Tâches"""
        print("\n✅ TEST CRUD TÂCHES")
        
        # Test récupération tâches
        response, response_time = self.make_request('GET', '/user/tasks')
        
        if response and response.status_code == 200:
            tasks = response.json()
            self.log_test("GET /api/user/tasks", True, f"Récupéré {len(tasks)} tâches", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/tasks", False, error_msg, response_time)
            return False
        
        # Test création tâche
        task_data = {
            "title": "Tailler les rosiers",
            "description": "Taille de fin d'hiver pour favoriser la floraison",
            "type": "pruning",
            "dueDate": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "completed": False
        }
        
        response, response_time = self.make_request('POST', '/user/tasks', json=task_data)
        
        if response and response.status_code == 200:
            task = response.json()
            task_id = task.get('id')
            self.log_test("POST /api/user/tasks", True, f"Tâche créée: {task.get('title')}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/user/tasks", False, error_msg, response_time)
            return False
        
        # Test mise à jour tâche (complétion)
        response, response_time = self.make_request('POST', f'/user/tasks/{task_id}/complete')
        
        if response and response.status_code == 200:
            self.log_test("POST /api/user/tasks/{id}/complete", True, "Tâche marquée comme terminée", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/user/tasks/{id}/complete", False, error_msg, response_time)
        
        # Test suppression tâche
        response, response_time = self.make_request('DELETE', f'/user/tasks/{task_id}')
        
        if response and response.status_code == 200:
            self.log_test("DELETE /api/user/tasks/{id}", True, "Tâche supprimée avec succès", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("DELETE /api/user/tasks/{id}", False, error_msg, response_time)
        
        return True
    
    def test_weather_api(self):
        """Test 6: API Météo"""
        print("\n🌤️ TEST API MÉTÉO")
        
        # Coordonnées de Paris pour les tests
        lat, lon = 48.8566, 2.3522
        
        # Test météo actuelle
        response, response_time = self.make_request('GET', f'/weather/current?lat={lat}&lon={lon}')
        
        if response and response.status_code == 200:
            weather = response.json()
            required_fields = ['temperature', 'humidity', 'precipitation', 'weather_code', 'wind_speed']
            has_all_fields = all(field in weather for field in required_fields)
            
            if has_all_fields:
                details = f"Temp: {weather.get('temperature')}°C, Humidité: {weather.get('humidity')}%"
                self.log_test("GET /api/weather/current", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in weather]
                self.log_test("GET /api/weather/current", False, f"Champs manquants: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/weather/current", False, error_msg, response_time)
        
        # Test prévisions météo 7 jours
        response, response_time = self.make_request('GET', f'/weather/forecast?lat={lat}&lon={lon}&days=7')
        
        if response and response.status_code == 200:
            forecast = response.json()
            daily_forecasts = forecast.get('daily', [])
            
            if len(daily_forecasts) == 7:
                first_day = daily_forecasts[0]
                required_fields = ['date', 'temperature_min', 'temperature_max', 'weather_code']
                has_all_fields = all(field in first_day for field in required_fields)
                
                if has_all_fields:
                    details = f"7 jours de prévisions, Min/Max: {first_day.get('temperature_min')}/{first_day.get('temperature_max')}°C"
                    self.log_test("GET /api/weather/forecast", True, details, response_time)
                else:
                    missing = [f for f in required_fields if f not in first_day]
                    self.log_test("GET /api/weather/forecast", False, f"Champs manquants dans prévision: {missing}", response_time)
            else:
                self.log_test("GET /api/weather/forecast", False, f"Attendu 7 jours, reçu {len(daily_forecasts)}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/weather/forecast", False, error_msg, response_time)
        
        return True
    
    def test_content_courses_workshops(self):
        """Test 7: Contenu (Formations/Ateliers)"""
        print("\n📚 TEST CONTENU (FORMATIONS/ATELIERS)")
        
        # Test formations
        response, response_time = self.make_request('GET', '/courses')
        
        if response and response.status_code == 200:
            courses = response.json()
            
            if len(courses) >= 4:
                first_course = courses[0]
                required_fields = ['_id', 'title', 'description', 'level', 'duration', 'price', 'slug', 'instructor', 'topics', 'image']
                has_all_fields = all(field in first_course for field in required_fields)
                
                if has_all_fields and first_course.get('image'):
                    details = f"{len(courses)} formations avec images, Instructeur: {first_course.get('instructor')}"
                    self.log_test("GET /api/courses", True, details, response_time)
                else:
                    missing = [f for f in required_fields if f not in first_course]
                    self.log_test("GET /api/courses", False, f"Champs manquants: {missing}", response_time)
            else:
                self.log_test("GET /api/courses", False, f"Attendu ≥4 formations, reçu {len(courses)}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/courses", False, error_msg, response_time)
        
        # Test ateliers
        response, response_time = self.make_request('GET', '/workshops')
        
        if response and response.status_code == 200:
            workshops = response.json()
            
            if len(workshops) >= 5:
                first_workshop = workshops[0]
                required_fields = ['_id', 'title', 'description', 'date', 'location', 'duration', 'price', 'slug', 'instructor', 'image']
                has_all_fields = all(field in first_workshop for field in required_fields)
                
                if has_all_fields and first_workshop.get('image'):
                    details = f"{len(workshops)} ateliers avec images, Prix: {first_workshop.get('price')}€"
                    self.log_test("GET /api/workshops", True, details, response_time)
                else:
                    missing = [f for f in required_fields if f not in first_workshop]
                    self.log_test("GET /api/workshops", False, f"Champs manquants: {missing}", response_time)
            else:
                self.log_test("GET /api/workshops", False, f"Attendu ≥5 ateliers, reçu {len(workshops)}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/workshops", False, error_msg, response_time)
        
        return True
    
    def test_quiz_system(self):
        """Test 8: Quiz quotidien"""
        print("\n🧠 TEST QUIZ QUOTIDIEN")
        
        # Test question du jour
        response, response_time = self.make_request('GET', '/quiz/today')
        
        if response and response.status_code == 200:
            quiz = response.json()
            required_fields = ['id', 'question', 'answers', 'alreadyAnswered']
            has_all_fields = all(field in quiz for field in required_fields)
            
            if has_all_fields:
                details = f"Question disponible, Déjà répondu: {quiz.get('alreadyAnswered')}"
                self.log_test("GET /api/quiz/today", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in quiz]
                self.log_test("GET /api/quiz/today", False, f"Champs manquants: {missing}", response_time)
        elif response and response.status_code == 404:
            self.log_test("GET /api/quiz/today", True, "Pas de question aujourd'hui (404 normal)", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/quiz/today", False, error_msg, response_time)
        
        # Test statistiques quiz avec todayAnswered
        response, response_time = self.make_request('GET', '/quiz/stats')
        
        if response and response.status_code == 200:
            stats = response.json()
            required_fields = ['currentStreak', 'totalXP', 'totalAnswered', 'totalCorrect', 'todayAnswered']
            has_all_fields = all(field in stats for field in required_fields)
            
            if has_all_fields:
                details = f"XP: {stats.get('totalXP')}, Streak: {stats.get('currentStreak')}, Aujourd'hui: {stats.get('todayAnswered')}"
                self.log_test("GET /api/quiz/stats", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in stats]
                self.log_test("GET /api/quiz/stats", False, f"Champs manquants: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/quiz/stats", False, error_msg, response_time)
        
        return True
    
    def test_referral_system(self):
        """Test 9: Système de parrainage"""
        print("\n🤝 TEST SYSTÈME DE PARRAINAGE")
        
        # Test génération code parrainage
        response, response_time = self.make_request('GET', '/user/referral/code')
        
        if response and response.status_code == 200:
            referral = response.json()
            required_fields = ['code', 'shareUrl', 'shareMessage']
            has_all_fields = all(field in referral for field in required_fields)
            
            if has_all_fields and referral.get('code', '').startswith('SEPALIS-'):
                details = f"Code: {referral.get('code')}, URL: {referral.get('shareUrl')}"
                self.log_test("GET /api/user/referral/code", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in referral]
                self.log_test("GET /api/user/referral/code", False, f"Champs manquants ou format incorrect: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/referral/code", False, error_msg, response_time)
        
        # Test statistiques parrainage
        response, response_time = self.make_request('GET', '/user/referral/stats')
        
        if response and response.status_code == 200:
            stats = response.json()
            required_fields = ['totalReferrals', 'activeReferrals', 'premiumEarned', 'nextReward']
            has_all_fields = all(field in stats for field in required_fields)
            
            if has_all_fields:
                details = f"Total: {stats.get('totalReferrals')}, Actifs: {stats.get('activeReferrals')}, Premium gagné: {stats.get('premiumEarned')}j"
                self.log_test("GET /api/user/referral/stats", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in stats]
                self.log_test("GET /api/user/referral/stats", False, f"Champs manquants: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/referral/stats", False, error_msg, response_time)
        
        return True
    
    def test_user_profile(self):
        """Test 10: Profil utilisateur"""
        print("\n👤 TEST PROFIL UTILISATEUR")
        
        # Test récupération profil
        response, response_time = self.make_request('GET', '/user/profile')
        
        if response and response.status_code == 200:
            profile = response.json()
            required_fields = ['firstName', 'lastName', 'email']
            has_all_fields = all(field in profile for field in required_fields)
            
            if has_all_fields:
                details = f"Email: {profile.get('email')}, Nom: {profile.get('firstName')} {profile.get('lastName')}"
                self.log_test("GET /api/user/profile", True, details, response_time)
            else:
                missing = [f for f in required_fields if f not in profile]
                self.log_test("GET /api/user/profile", False, f"Champs manquants: {missing}", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("GET /api/user/profile", False, error_msg, response_time)
        
        # Test mise à jour profil
        update_data = {
            "firstName": "Test",
            "lastName": "Updated"
        }
        
        response, response_time = self.make_request('PUT', '/user/profile', json=update_data)
        
        if response and response.status_code == 200:
            self.log_test("PUT /api/user/profile", True, "Profil mis à jour avec succès", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("PUT /api/user/profile", False, error_msg, response_time)
        
        # Test changement mot de passe
        password_data = {
            "currentPassword": "TestPassword123!",
            "newPassword": "NewTestPassword123!"
        }
        
        response, response_time = self.make_request('POST', '/user/change-password', json=password_data)
        
        if response and response.status_code == 200:
            self.log_test("POST /api/user/change-password", True, "Mot de passe changé avec succès", response_time)
        else:
            error_msg = f"Status: {response.status_code if response else 'No response'}"
            self.log_test("POST /api/user/change-password", False, error_msg, response_time)
        
        return True
    
    def run_all_tests(self):
        """Exécuter tous les tests critiques"""
        print("🧪 TESTS COMPLETS BACKEND SEPALIS - ANALYSE AVANT DÉPLOIEMENT APP STORE/PLAY STORE")
        print("=" * 80)
        
        start_time = time.time()
        
        # Tests dans l'ordre de priorité critique
        tests = [
            ("Health Check", self.test_health_check),
            ("Authentification & Sécurité", self.test_authentication),
            ("Protection Routes Admin", self.test_admin_security),
            ("Système d'Abonnement", self.test_subscription_system),
            ("CRUD Zones", self.test_zones_crud),
            ("CRUD Plantes", self.test_plants_crud),
            ("CRUD Tâches", self.test_tasks_crud),
            ("API Météo", self.test_weather_api),
            ("Contenu (Formations/Ateliers)", self.test_content_courses_workshops),
            ("Quiz Quotidien", self.test_quiz_system),
            ("Système de Parrainage", self.test_referral_system),
            ("Profil Utilisateur", self.test_user_profile)
        ]
        
        for test_name, test_func in tests:
            try:
                test_func()
            except Exception as e:
                self.log_test(f"ERREUR {test_name}", False, f"Exception: {str(e)}")
        
        total_time = time.time() - start_time
        
        # Résumé des résultats
        print("\n" + "=" * 80)
        print("📊 RÉSUMÉ DES TESTS BACKEND SEPALIS")
        print("=" * 80)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        success_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"✅ Tests réussis: {passed}/{total} ({success_rate:.1f}%)")
        print(f"⏱️  Temps total: {total_time:.2f}s")
        print(f"🌐 Backend URL: {BACKEND_URL}")
        
        # Détail des échecs
        failures = [result for result in self.test_results if not result['success']]
        if failures:
            print(f"\n❌ ÉCHECS CRITIQUES ({len(failures)}):")
            for failure in failures:
                print(f"   • {failure['test']}: {failure['details']}")
        
        # Points critiques pour déploiement
        print(f"\n🎯 ANALYSE CRITIQUE POUR DÉPLOIEMENT:")
        
        critical_endpoints = [
            "POST /api/auth/register",
            "POST /api/auth/login", 
            "Protection JWT endpoints",
            "Protection route /admin/",
            "GET /api/user/subscription",
            "POST /api/user/zones",
            "GET /api/weather/current",
            "GET /api/courses",
            "GET /api/quiz/stats"
        ]
        
        critical_failures = [r for r in self.test_results if not r['success'] and any(endpoint in r['test'] for endpoint in critical_endpoints)]
        
        if not critical_failures:
            print("   ✅ Tous les endpoints critiques fonctionnent")
            print("   ✅ Sécurité JWT et admin validée")
            print("   ✅ CRUD principal opérationnel")
            print("   ✅ API météo et contenu accessibles")
            print("   🚀 BACKEND PRÊT POUR DÉPLOIEMENT APP STORE/PLAY STORE")
        else:
            print("   ❌ PROBLÈMES CRITIQUES IDENTIFIÉS:")
            for failure in critical_failures:
                print(f"      • {failure['test']}")
            print("   ⚠️  CORRECTION REQUISE AVANT DÉPLOIEMENT")
        
        # Temps de réponse
        avg_response_time = sum(float(r['response_time'].replace('s', '')) for r in self.test_results) / len(self.test_results)
        if avg_response_time < 2.0:
            print(f"   ✅ Temps de réponse moyen: {avg_response_time:.3f}s (< 2s)")
        else:
            print(f"   ⚠️  Temps de réponse moyen: {avg_response_time:.3f}s (> 2s)")
        
        return success_rate >= 85  # 85% minimum pour validation

if __name__ == "__main__":
    tester = SepalisBackendTester()
    success = tester.run_all_tests()
    exit(0 if success else 1)