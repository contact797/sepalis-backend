#!/usr/bin/env python3
"""
Tests complets pour l'API backend Sepalis
Teste tous les endpoints critiques avant lancement
"""

import asyncio
import aiohttp
import json
import uuid
from datetime import datetime, timedelta
import sys
import os

# Configuration
BASE_URL = "https://gardenpro-app.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"test-sepalis-{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_NAME = "Test Sepalis User"

class SepalisAPITester:
    def __init__(self):
        self.session = None
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        self.total_tests = 0
        self.passed_tests = 0
        
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    def log_test(self, test_name: str, success: bool, details: str = ""):
        """Log test result"""
        self.total_tests += 1
        if success:
            self.passed_tests += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = f"{status} - {test_name}"
        if details:
            result += f" | {details}"
        
        print(result)
        self.test_results.append({
            "name": test_name,
            "success": success,
            "details": details
        })
    
    async def test_health_check(self):
        """Test basic API health"""
        try:
            async with self.session.get(f"{BASE_URL}/../") as response:
                if response.status == 200:
                    self.log_test("Health Check", True, "API accessible")
                else:
                    self.log_test("Health Check", False, f"Status: {response.status}")
        except Exception as e:
            self.log_test("Health Check", False, f"Error: {str(e)}")
    
    async def test_auth_register(self):
        """Test user registration"""
        try:
            payload = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
            
            async with self.session.post(f"{BASE_URL}/auth/register", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if "token" in data and "user" in data:
                        self.auth_token = data["token"]
                        self.user_id = data["user"]["id"]
                        self.log_test("Auth Register", True, f"User created: {data['user']['email']}")
                    else:
                        self.log_test("Auth Register", False, "Missing token or user in response")
                else:
                    error_text = await response.text()
                    self.log_test("Auth Register", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Auth Register", False, f"Error: {str(e)}")
    
    async def test_auth_login(self):
        """Test user login"""
        try:
            payload = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            async with self.session.post(f"{BASE_URL}/auth/login", json=payload) as response:
                if response.status == 200:
                    data = await response.json()
                    if "token" in data and "user" in data:
                        self.log_test("Auth Login", True, f"Login successful: {data['user']['email']}")
                    else:
                        self.log_test("Auth Login", False, "Missing token or user in response")
                else:
                    error_text = await response.text()
                    self.log_test("Auth Login", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Auth Login", False, f"Error: {str(e)}")
    
    async def test_auth_me(self):
        """Test JWT authentication"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{BASE_URL}/auth/me", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("email") == TEST_USER_EMAIL:
                        self.log_test("Auth JWT Validation", True, f"JWT valid for user: {data['email']}")
                    else:
                        self.log_test("Auth JWT Validation", False, "User data mismatch")
                else:
                    error_text = await response.text()
                    self.log_test("Auth JWT Validation", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Auth JWT Validation", False, f"Error: {str(e)}")
    
    async def test_subscription_start_trial(self):
        """Test starting 7-day trial (CRITICAL - NOT YET TESTED)"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.post(f"{BASE_URL}/user/start-trial", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if data.get("success") and "expiresAt" in data:
                        expires_at = datetime.fromisoformat(data["expiresAt"].replace('Z', '+00:00'))
                        days_diff = (expires_at - datetime.utcnow()).days
                        if 6 <= days_diff <= 7:  # Allow some margin for processing time
                            self.log_test("Subscription Start Trial", True, f"Trial started, expires: {data['expiresAt']}")
                        else:
                            self.log_test("Subscription Start Trial", False, f"Invalid trial duration: {days_diff} days")
                    else:
                        self.log_test("Subscription Start Trial", False, f"Invalid response: {data}")
                else:
                    error_text = await response.text()
                    self.log_test("Subscription Start Trial", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Subscription Start Trial", False, f"Error: {str(e)}")
    
    async def test_subscription_status(self):
        """Test subscription status check (CRITICAL - NOT YET TESTED)"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{BASE_URL}/user/subscription", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["isActive", "isTrial", "daysRemaining", "isExpired"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        if data.get("isActive") and data.get("isTrial") and data.get("daysRemaining", 0) > 0:
                            self.log_test("Subscription Status", True, f"Active trial: {data['daysRemaining']} days remaining")
                        else:
                            self.log_test("Subscription Status", True, f"Status: Active={data.get('isActive')}, Trial={data.get('isTrial')}, Days={data.get('daysRemaining')}")
                    else:
                        self.log_test("Subscription Status", False, f"Missing fields: {missing_fields}")
                else:
                    error_text = await response.text()
                    self.log_test("Subscription Status", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Subscription Status", False, f"Error: {str(e)}")
    
    async def test_subscription_without_jwt(self):
        """Test subscription endpoints require JWT"""
        try:
            # Test without Authorization header
            async with self.session.get(f"{BASE_URL}/user/subscription") as response:
                if response.status == 403:
                    self.log_test("Subscription JWT Protection", True, "Correctly blocked without JWT")
                else:
                    self.log_test("Subscription JWT Protection", False, f"Should return 403, got: {response.status}")
        except Exception as e:
            self.log_test("Subscription JWT Protection", False, f"Error: {str(e)}")
    
    async def test_zones_crud(self):
        """Test zones CRUD operations"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        zone_id = None
        
        # Test GET empty zones
        try:
            async with self.session.get(f"{BASE_URL}/user/zones", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        self.log_test("Zones GET (empty)", True, f"Retrieved {len(data)} zones")
                    else:
                        self.log_test("Zones GET (empty)", False, "Response is not a list")
                else:
                    error_text = await response.text()
                    self.log_test("Zones GET (empty)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Zones GET (empty)", False, f"Error: {str(e)}")
        
        # Test POST create zone
        try:
            zone_data = {
                "name": "Zone Test Sepalis",
                "type": "vegetable",
                "length": 5.0,
                "width": 3.0,
                "area": 15.0,
                "soilType": "Argileux",
                "soilPH": "Neutre (6.5-7.5)",
                "drainage": "Bon",
                "sunExposure": "Plein soleil",
                "climateZone": "Océanique",
                "windProtection": "Protégé",
                "wateringSystem": "Arrosage manuel",
                "humidity": "Normale",
                "notes": "Zone de test pour les légumes",
                "color": "#4CAF50"
            }
            
            async with self.session.post(f"{BASE_URL}/user/zones", json=zone_data, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    zone_id_field = data.get("id") or data.get("_id")
                    if zone_id_field and data.get("name") == zone_data["name"]:
                        zone_id = zone_id_field
                        self.log_test("Zones POST (create)", True, f"Zone created: {data['name']}")
                    else:
                        self.log_test("Zones POST (create)", False, "Invalid response structure")
                else:
                    error_text = await response.text()
                    self.log_test("Zones POST (create)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Zones POST (create)", False, f"Error: {str(e)}")
        
        # Test GET zone by ID
        if zone_id:
            try:
                async with self.session.get(f"{BASE_URL}/user/zones/{zone_id}", headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        retrieved_id = data.get("id") or data.get("_id")
                        if retrieved_id == zone_id:
                            self.log_test("Zones GET (by ID)", True, f"Retrieved zone: {data['name']}")
                        else:
                            self.log_test("Zones GET (by ID)", False, "Zone ID mismatch")
                    else:
                        error_text = await response.text()
                        self.log_test("Zones GET (by ID)", False, f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_test("Zones GET (by ID)", False, f"Error: {str(e)}")
    
    async def test_plants_crud(self):
        """Test plants CRUD operations"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        plant_id = None
        
        # Test GET empty plants
        try:
            async with self.session.get(f"{BASE_URL}/user/plants", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        self.log_test("Plants GET (empty)", True, f"Retrieved {len(data)} plants")
                    else:
                        self.log_test("Plants GET (empty)", False, "Response is not a list")
                else:
                    error_text = await response.text()
                    self.log_test("Plants GET (empty)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Plants GET (empty)", False, f"Error: {str(e)}")
        
        # Test POST create plant
        try:
            plant_data = {
                "name": "Tomate Cerise Test",
                "scientificName": "Solanum lycopersicum var. cerasiforme",
                "wateringFrequency": 3,
                "description": "Tomate cerise pour tests Sepalis"
            }
            
            async with self.session.post(f"{BASE_URL}/user/plants", json=plant_data, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    plant_id_field = data.get("id") or data.get("_id")
                    if plant_id_field and data.get("name") == plant_data["name"]:
                        plant_id = plant_id_field
                        self.log_test("Plants POST (create)", True, f"Plant created: {data['name']}")
                    else:
                        self.log_test("Plants POST (create)", False, "Invalid response structure")
                else:
                    error_text = await response.text()
                    self.log_test("Plants POST (create)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Plants POST (create)", False, f"Error: {str(e)}")
    
    async def test_tasks_crud(self):
        """Test tasks CRUD operations"""
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        task_id = None
        
        # Test GET empty tasks
        try:
            async with self.session.get(f"{BASE_URL}/user/tasks", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list):
                        self.log_test("Tasks GET (empty)", True, f"Retrieved {len(data)} tasks")
                    else:
                        self.log_test("Tasks GET (empty)", False, "Response is not a list")
                else:
                    error_text = await response.text()
                    self.log_test("Tasks GET (empty)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Tasks GET (empty)", False, f"Error: {str(e)}")
        
        # Test POST create task
        try:
            task_data = {
                "title": "Arroser les tomates",
                "description": "Arrosage quotidien des tomates cerises",
                "type": "watering",
                "dueDate": (datetime.utcnow() + timedelta(days=1)).isoformat(),
                "completed": False
            }
            
            async with self.session.post(f"{BASE_URL}/user/tasks", json=task_data, headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    task_id_field = data.get("id") or data.get("_id")
                    if task_id_field and data.get("title") == task_data["title"]:
                        task_id = task_id_field
                        self.log_test("Tasks POST (create)", True, f"Task created: {data['title']}")
                    else:
                        self.log_test("Tasks POST (create)", False, "Invalid response structure")
                else:
                    error_text = await response.text()
                    self.log_test("Tasks POST (create)", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Tasks POST (create)", False, f"Error: {str(e)}")
        
        # Test DELETE task
        if task_id:
            try:
                async with self.session.delete(f"{BASE_URL}/user/tasks/{task_id}", headers=headers) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "message" in data:
                            self.log_test("Tasks DELETE", True, "Task deleted successfully")
                        else:
                            self.log_test("Tasks DELETE", False, "Invalid response structure")
                    else:
                        error_text = await response.text()
                        self.log_test("Tasks DELETE", False, f"Status: {response.status}, Error: {error_text}")
            except Exception as e:
                self.log_test("Tasks DELETE", False, f"Error: {str(e)}")
    
    async def test_weather_api(self):
        """Test weather API endpoints"""
        # Test current weather (Paris coordinates)
        try:
            params = {"lat": 48.8566, "lon": 2.3522}
            async with self.session.get(f"{BASE_URL}/weather/current", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["temperature", "humidity", "precipitation", "weather_code", "wind_speed"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test("Weather Current API", True, f"Temp: {data.get('temperature')}°C, Humidity: {data.get('humidity')}%")
                    else:
                        self.log_test("Weather Current API", False, f"Missing fields: {missing_fields}")
                else:
                    error_text = await response.text()
                    self.log_test("Weather Current API", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Weather Current API", False, f"Error: {str(e)}")
        
        # Test forecast weather
        try:
            params = {"lat": 48.8566, "lon": 2.3522, "days": 7}
            async with self.session.get(f"{BASE_URL}/weather/forecast", params=params) as response:
                if response.status == 200:
                    data = await response.json()
                    if "daily" in data and isinstance(data["daily"], list):
                        forecast_count = len(data["daily"])
                        if forecast_count == 7:
                            self.log_test("Weather Forecast API", True, f"Retrieved {forecast_count} days forecast")
                        else:
                            self.log_test("Weather Forecast API", False, f"Expected 7 days, got {forecast_count}")
                    else:
                        self.log_test("Weather Forecast API", False, "Invalid forecast structure")
                else:
                    error_text = await response.text()
                    self.log_test("Weather Forecast API", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Weather Forecast API", False, f"Error: {str(e)}")
    
    async def test_bookings_api(self):
        """Test bookings history API"""
        try:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            async with self.session.get(f"{BASE_URL}/user/bookings", headers=headers) as response:
                if response.status == 200:
                    data = await response.json()
                    required_fields = ["bookings", "total", "workshops", "courses"]
                    missing_fields = [field for field in required_fields if field not in data]
                    
                    if not missing_fields:
                        self.log_test("Bookings API", True, f"Total: {data['total']}, Workshops: {data['workshops']}, Courses: {data['courses']}")
                    else:
                        self.log_test("Bookings API", False, f"Missing fields: {missing_fields}")
                else:
                    error_text = await response.text()
                    self.log_test("Bookings API", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Bookings API", False, f"Error: {str(e)}")
    
    async def test_workshops_api(self):
        """Test workshops list API"""
        try:
            async with self.session.get(f"{BASE_URL}/workshops") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list) and len(data) > 0:
                        workshop = data[0]
                        required_fields = ["title", "description", "price", "slug", "instructor"]
                        missing_fields = [field for field in required_fields if field not in workshop]
                        # Check for either id or _id
                        if not (workshop.get("id") or workshop.get("_id")):
                            missing_fields.append("id/_id")
                        
                        if not missing_fields:
                            self.log_test("Workshops API", True, f"Retrieved {len(data)} workshops")
                        else:
                            self.log_test("Workshops API", False, f"Missing fields in workshop: {missing_fields}")
                    else:
                        self.log_test("Workshops API", False, "No workshops returned or invalid structure")
                else:
                    error_text = await response.text()
                    self.log_test("Workshops API", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Workshops API", False, f"Error: {str(e)}")
    
    async def test_courses_api(self):
        """Test courses list API"""
        try:
            async with self.session.get(f"{BASE_URL}/courses") as response:
                if response.status == 200:
                    data = await response.json()
                    if isinstance(data, list) and len(data) > 0:
                        course = data[0]
                        required_fields = ["title", "description", "price", "slug", "instructor", "image"]
                        missing_fields = [field for field in required_fields if field not in course]
                        # Check for either id or _id
                        if not (course.get("id") or course.get("_id")):
                            missing_fields.append("id/_id")
                        
                        if not missing_fields:
                            self.log_test("Courses API", True, f"Retrieved {len(data)} courses with images")
                        else:
                            self.log_test("Courses API", False, f"Missing fields in course: {missing_fields}")
                    else:
                        self.log_test("Courses API", False, "No courses returned or invalid structure")
                else:
                    error_text = await response.text()
                    self.log_test("Courses API", False, f"Status: {response.status}, Error: {error_text}")
        except Exception as e:
            self.log_test("Courses API", False, f"Error: {str(e)}")
    
    async def run_all_tests(self):
        """Run all tests in sequence"""
        print("🚀 DÉMARRAGE DES TESTS BACKEND SEPALIS")
        print("=" * 60)
        
        # Basic connectivity
        await self.test_health_check()
        
        # Authentication flow
        await self.test_auth_register()
        await self.test_auth_login()
        await self.test_auth_me()
        
        # CRITICAL: Subscription system (PRIORITY HIGH - NOT YET TESTED)
        print("\n🔥 TESTS SYSTÈME D'ABONNEMENT (CRITIQUE)")
        print("-" * 40)
        await self.test_subscription_without_jwt()
        await self.test_subscription_start_trial()
        await self.test_subscription_status()
        
        # CRUD operations
        print("\n📊 TESTS ENDPOINTS CRUD")
        print("-" * 40)
        await self.test_zones_crud()
        await self.test_plants_crud()
        await self.test_tasks_crud()
        
        # External APIs
        print("\n🌤️ TESTS API MÉTÉO")
        print("-" * 40)
        await self.test_weather_api()
        
        # Bookings and content
        print("\n📚 TESTS RÉSERVATIONS ET CONTENU")
        print("-" * 40)
        await self.test_bookings_api()
        await self.test_workshops_api()
        await self.test_courses_api()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        success_rate = (self.passed_tests / self.total_tests * 100) if self.total_tests > 0 else 0
        print(f"✅ Tests réussis: {self.passed_tests}/{self.total_tests} ({success_rate:.1f}%)")
        
        if self.passed_tests == self.total_tests:
            print("🎉 TOUS LES TESTS SONT PASSÉS - BACKEND PRÊT POUR LE LANCEMENT!")
        else:
            print("⚠️ CERTAINS TESTS ONT ÉCHOUÉ - VÉRIFICATION NÉCESSAIRE")
            
            failed_tests = [test for test in self.test_results if not test["success"]]
            print(f"\n❌ Tests échoués ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['name']}: {test['details']}")
        
        return success_rate == 100.0

async def main():
    """Main test runner"""
    async with SepalisAPITester() as tester:
        success = await tester.run_all_tests()
        return success

if __name__ == "__main__":
    try:
        success = asyncio.run(main())
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrompus par l'utilisateur")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erreur lors des tests: {str(e)}")
        sys.exit(1)