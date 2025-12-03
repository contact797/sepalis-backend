#!/usr/bin/env python3
"""
Tests complets pour les endpoints météo de l'API Sepalis
Teste les nouveaux endpoints utilisant l'API Open-Meteo
"""

import asyncio
import httpx
import json
from datetime import datetime
import sys
import os

# Configuration
BASE_URL = "https://garden-booking-2.preview.emergentagent.com/api"
PARIS_LAT = 48.8566
PARIS_LON = 2.3522

class WeatherAPITester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        self.passed_tests = 0
        self.total_tests = 0
        
    def log_test(self, test_name, success, message, response_data=None):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_health_check(self):
        """Test GET / endpoint"""
        try:
            response = requests.get(f"{self.base_url}/", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data and "Sepalis" in data["message"]:
                    self.log_test("Health Check", True, f"API is running - {data['message']}")
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected response format: {data}")
                    return False
            else:
                self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Health Check", False, f"Connection error: {str(e)}")
            return False
    
    def test_register(self):
        """Test POST /auth/register endpoint"""
        try:
            # First, try to register a new user
            register_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": TEST_USER_NAME
            }
            
            response = requests.post(
                f"{self.base_url}/auth/register",
                json=register_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User Registration", True, f"User registered successfully: {data['user']['email']}")
                    return True
                else:
                    self.log_test("User Registration", False, f"Missing token or user in response: {data}")
                    return False
            elif response.status_code == 400:
                # User might already exist, try to login instead
                self.log_test("User Registration", True, "User already exists (expected), will use login")
                return True
            else:
                self.log_test("User Registration", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Registration", False, f"Request error: {str(e)}")
            return False
    
    def test_login(self):
        """Test POST /auth/login endpoint"""
        try:
            login_data = {
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
            
            response = requests.post(
                f"{self.base_url}/auth/login",
                json=login_data,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "token" in data and "user" in data:
                    self.token = data["token"]
                    self.user_id = data["user"]["id"]
                    self.log_test("User Login", True, f"Login successful for: {data['user']['email']}")
                    return True
                else:
                    self.log_test("User Login", False, f"Missing token or user in response: {data}")
                    return False
            else:
                self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Login", False, f"Request error: {str(e)}")
            return False
    
    def test_profile(self):
        """Test GET /auth/me endpoint (protected)"""
        if not self.token:
            self.log_test("Get Profile", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/auth/me",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "id" in data and "email" in data and "name" in data:
                    self.log_test("Get Profile", True, f"Profile retrieved: {data['email']}")
                    return True
                else:
                    self.log_test("Get Profile", False, f"Missing profile fields: {data}")
                    return False
            else:
                self.log_test("Get Profile", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Profile", False, f"Request error: {str(e)}")
            return False
    
    def test_plants(self):
        """Test GET /user/plants endpoint (protected)"""
        if not self.token:
            self.log_test("Get Plants", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/plants",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Plants", True, f"Plants list retrieved: {len(data)} plants")
                    return True
                else:
                    self.log_test("Get Plants", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Plants", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Plants", False, f"Request error: {str(e)}")
            return False
    
    def test_tasks(self):
        """Test GET /user/tasks endpoint (protected)"""
        if not self.token:
            self.log_test("Get Tasks", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/tasks",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Tasks", True, f"Tasks list retrieved: {len(data)} tasks")
                    return True
                else:
                    self.log_test("Get Tasks", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Tasks", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Tasks", False, f"Request error: {str(e)}")
            return False
    
    def test_courses(self):
        """Test GET /courses endpoint (public) - Focus on images"""
        try:
            response = requests.get(f"{self.base_url}/courses", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Courses", True, f"Courses list retrieved: {len(data)} courses")
                    # Store courses data for detailed image testing
                    self.courses_data = data
                    return True
                else:
                    self.log_test("Get Courses", False, f"Expected non-empty list, got: {data}")
                    return False
            else:
                self.log_test("Get Courses", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Courses", False, f"Request error: {str(e)}")
            return False
    
    def test_courses_image_structure(self):
        """Test that all courses have proper image fields with valid URLs"""
        if not hasattr(self, 'courses_data') or not self.courses_data:
            self.log_test("Courses Image Structure", False, "No courses data available from previous test")
            return False
        
        try:
            required_fields = ["title", "description", "level", "duration", "price", "slug", "instructor", "topics", "image"]
            courses_with_images = 0
            invalid_images = []
            
            for i, course in enumerate(self.courses_data):
                # Check required fields (handle both 'id' and '_id')
                missing_fields = []
                for field in required_fields:
                    if field not in course:
                        missing_fields.append(field)
                
                # Check for ID field (either 'id' or '_id')
                if 'id' not in course and '_id' not in course:
                    missing_fields.append('id/_id')
                
                if missing_fields:
                    self.log_test("Courses Image Structure", False, f"Course {i+1} missing fields: {missing_fields}")
                    return False
                
                # Check image field specifically
                if course.get("image"):
                    image_url = course["image"]
                    
                    # Validate URL format
                    if not (image_url.startswith("http://") or image_url.startswith("https://")):
                        invalid_images.append(f"Course '{course['title']}': Invalid URL format '{image_url}'")
                    else:
                        courses_with_images += 1
                        
                        # Test image URL accessibility
                        try:
                            head_response = requests.head(image_url, timeout=5)
                            if head_response.status_code not in [200, 301, 302]:
                                invalid_images.append(f"Course '{course['title']}': Image URL not accessible (status {head_response.status_code})")
                        except Exception as e:
                            # Don't fail the test for network issues, just log
                            print(f"   Warning: Could not verify image URL for '{course['title']}': {str(e)}")
                else:
                    invalid_images.append(f"Course '{course['title']}': No image field")
            
            if courses_with_images == len(self.courses_data) and len(invalid_images) == 0:
                self.log_test("Courses Image Structure", True, f"All {len(self.courses_data)} courses have valid image URLs")
                return True
            else:
                error_msg = f"{courses_with_images}/{len(self.courses_data)} courses with valid images. Issues: {'; '.join(invalid_images)}"
                self.log_test("Courses Image Structure", False, error_msg)
                return False
                
        except Exception as e:
            self.log_test("Courses Image Structure", False, f"Error validating image structure: {str(e)}")
            return False
    
    def test_courses_content_validation(self):
        """Test specific course content matches expected data"""
        if not hasattr(self, 'courses_data') or not self.courses_data:
            self.log_test("Courses Content Validation", False, "No courses data available")
            return False
        
        try:
            expected_courses = 4
            if len(self.courses_data) != expected_courses:
                self.log_test("Courses Content Validation", False, f"Expected {expected_courses} courses, got {len(self.courses_data)}")
                return False
            
            # Check for expected course titles
            course_titles = [course["title"] for course in self.courses_data]
            expected_titles = [
                "Massif Fleuri Toute l'Année",
                "Tailler et Soigner ses Rosiers", 
                "Tailler Sans Se Tromper : Arbustes et Rosiers",
                "Vivaces Faciles : Jardin Sans Entretien"
            ]
            
            missing_titles = [title for title in expected_titles if title not in course_titles]
            if missing_titles:
                self.log_test("Courses Content Validation", False, f"Missing expected courses: {missing_titles}")
                return False
            
            # Check that all courses have Nicolas Blot as instructor
            non_nicolas_courses = [course["title"] for course in self.courses_data if "Nicolas Blot" not in course.get("instructor", "")]
            if non_nicolas_courses:
                self.log_test("Courses Content Validation", False, f"Courses without Nicolas Blot: {non_nicolas_courses}")
                return False
            
            # Check that all courses have Unsplash images
            non_unsplash_images = []
            for course in self.courses_data:
                if course.get("image") and "unsplash.com" not in course["image"]:
                    non_unsplash_images.append(f"{course['title']}: {course['image']}")
            
            if non_unsplash_images:
                self.log_test("Courses Content Validation", False, f"Non-Unsplash images found: {non_unsplash_images}")
                return False
            
            self.log_test("Courses Content Validation", True, f"All {len(self.courses_data)} courses have correct content and Unsplash images")
            return True
            
        except Exception as e:
            self.log_test("Courses Content Validation", False, f"Error validating course content: {str(e)}")
            return False
    
    def test_zones_empty(self):
        """Test GET /user/zones endpoint (protected) - should return empty list initially"""
        if not self.token:
            self.log_test("Get Zones (Empty)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/zones",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Zones (Empty)", True, f"Zones list retrieved: {len(data)} zones (expected empty)")
                    return True
                else:
                    self.log_test("Get Zones (Empty)", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Zones (Empty)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Zones (Empty)", False, f"Request error: {str(e)}")
            return False
    
    def test_create_zone(self):
        """Test POST /user/zones endpoint (protected) - create a new zone"""
        if not self.token:
            self.log_test("Create Zone", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            zone_data = {
                "name": "Terrasse Sud Test",
                "type": "vegetable",
                "length": 5.0,
                "width": 3.0,
                "area": 15.0,
                "soilType": "Terreau enrichi",
                "soilPH": "6.5-7.0",
                "drainage": "Bon",
                "sunExposure": "Plein soleil",
                "climateZone": "Tempéré océanique",
                "windProtection": "Partiellement protégé",
                "wateringSystem": "Arrosage manuel",
                "humidity": "Modérée",
                "notes": "Zone test pour validation API",
                "color": "#4CAF50"
            }
            
            response = requests.post(
                f"{self.base_url}/user/zones",
                json=zone_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                # Handle both 'id' and '_id' field names
                zone_id = data.get("id") or data.get("_id")
                if zone_id and "userId" in data and data["name"] == zone_data["name"]:
                    self.created_zone_id = zone_id
                    self.log_test("Create Zone", True, f"Zone created successfully: {data['name']} (ID: {zone_id})")
                    return True
                else:
                    self.log_test("Create Zone", False, f"Missing required fields in response: {data}")
                    return False
            else:
                self.log_test("Create Zone", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Create Zone", False, f"Request error: {str(e)}")
            return False
    
    def test_get_zone_by_id(self):
        """Test GET /user/zones/{zone_id} endpoint (protected) - get specific zone"""
        if not self.token:
            self.log_test("Get Zone by ID", False, "No authentication token available")
            return False
        
        if not hasattr(self, 'created_zone_id') or not self.created_zone_id:
            self.log_test("Get Zone by ID", False, "No zone ID available from previous test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/zones/{self.created_zone_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                zone_id = data.get("id") or data.get("_id")
                if zone_id and zone_id == self.created_zone_id:
                    self.log_test("Get Zone by ID", True, f"Zone retrieved successfully: {data['name']}")
                    return True
                else:
                    self.log_test("Get Zone by ID", False, f"Zone ID mismatch or missing: {data}")
                    return False
            else:
                self.log_test("Get Zone by ID", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Zone by ID", False, f"Request error: {str(e)}")
            return False
    
    def test_update_zone(self):
        """Test PUT /user/zones/{zone_id} endpoint (protected) - update zone"""
        if not self.token:
            self.log_test("Update Zone", False, "No authentication token available")
            return False
        
        if not hasattr(self, 'created_zone_id') or not self.created_zone_id:
            self.log_test("Update Zone", False, "No zone ID available from previous test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            updated_zone_data = {
                "name": "Terrasse Sud Test - Modifiée",
                "type": "vegetable",
                "length": 5.0,
                "width": 3.0,
                "area": 15.0,
                "soilType": "Terreau enrichi bio",
                "soilPH": "6.5-7.0",
                "drainage": "Excellent",
                "sunExposure": "Plein soleil",
                "climateZone": "Tempéré océanique",
                "windProtection": "Bien protégé",
                "wateringSystem": "Goutte à goutte",
                "humidity": "Modérée",
                "notes": "Zone mise à jour via API",
                "color": "#2196F3"
            }
            
            response = requests.put(
                f"{self.base_url}/user/zones/{self.created_zone_id}",
                json=updated_zone_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "name" in data and data["name"] == updated_zone_data["name"]:
                    self.log_test("Update Zone", True, f"Zone updated successfully: {data['name']}")
                    return True
                else:
                    self.log_test("Update Zone", False, f"Update verification failed: {data}")
                    return False
            else:
                self.log_test("Update Zone", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Update Zone", False, f"Request error: {str(e)}")
            return False
    
    def test_zones_with_data(self):
        """Test GET /user/zones endpoint (protected) - should now return the created zone"""
        if not self.token:
            self.log_test("Get Zones (With Data)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/zones",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    zone = data[0]
                    zone_id = zone.get("id") or zone.get("_id")
                    if hasattr(self, 'created_zone_id') and zone_id == self.created_zone_id:
                        self.log_test("Get Zones (With Data)", True, f"Zone appears in list: {zone['name']}")
                        return True
                    else:
                        self.log_test("Get Zones (With Data)", True, f"Zones list retrieved: {len(data)} zones")
                        return True
                else:
                    self.log_test("Get Zones (With Data)", False, f"Expected non-empty list, got: {data}")
                    return False
            else:
                self.log_test("Get Zones (With Data)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Zones (With Data)", False, f"Request error: {str(e)}")
            return False
    
    def test_delete_zone(self):
        """Test DELETE /user/zones/{zone_id} endpoint (protected) - delete zone"""
        if not self.token:
            self.log_test("Delete Zone", False, "No authentication token available")
            return False
        
        if not hasattr(self, 'created_zone_id') or not self.created_zone_id:
            self.log_test("Delete Zone", False, "No zone ID available from previous test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.delete(
                f"{self.base_url}/user/zones/{self.created_zone_id}",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Delete Zone", True, f"Zone deleted successfully: {data['message']}")
                    return True
                else:
                    self.log_test("Delete Zone", False, f"Unexpected response format: {data}")
                    return False
            else:
                self.log_test("Delete Zone", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Delete Zone", False, f"Request error: {str(e)}")
            return False
    
    def test_zones_after_delete(self):
        """Test GET /user/zones endpoint (protected) - should be empty after deletion"""
        if not self.token:
            self.log_test("Get Zones (After Delete)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/zones",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Get Zones (After Delete)", True, f"Zones list after delete: {len(data)} zones")
                    return True
                else:
                    self.log_test("Get Zones (After Delete)", False, f"Expected list, got: {type(data)}")
                    return False
            else:
                self.log_test("Get Zones (After Delete)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Get Zones (After Delete)", False, f"Request error: {str(e)}")
            return False
    
    def test_jwt_protection_zones(self):
        """Test that zones endpoints are properly protected by JWT"""
        try:
            # Test without token
            response = requests.get(f"{self.base_url}/user/zones", timeout=10)
            
            if response.status_code == 403:
                self.log_test("JWT Protection (Zones)", True, "Zones endpoint properly protected - unauthorized access blocked")
                return True
            else:
                self.log_test("JWT Protection (Zones)", False, f"Expected 403, got {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("JWT Protection (Zones)", False, f"Request error: {str(e)}")
            return False
    
    def test_preregister_course_success(self):
        """Test successful course pre-registration with all fields"""
        if not self.token:
            self.log_test("Course Preregister (Success)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            preregistration_data = {
                "courseSlug": "massif-fleuri",
                "firstName": "Marie",
                "lastName": "Dupont",
                "email": "marie.dupont@example.com",
                "phone": "0123456789",
                "message": "Je suis très intéressée par cette formation sur les massifs fleuris."
            }
            
            response = requests.post(
                f"{self.base_url}/courses/preregister",
                json=preregistration_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields in response (handle both 'id' and '_id')
                required_fields = ["courseSlug", "firstName", "lastName", "email", "phone", "message", "userId", "createdAt"]
                missing_fields = [field for field in required_fields if field not in data]
                
                # Check for ID field (either 'id' or '_id')
                if 'id' not in data and '_id' not in data:
                    missing_fields.append('id/_id')
                
                if not missing_fields:
                    # Verify data matches input
                    if (data["courseSlug"] == preregistration_data["courseSlug"] and
                        data["firstName"] == preregistration_data["firstName"] and
                        data["lastName"] == preregistration_data["lastName"] and
                        data["email"] == preregistration_data["email"] and
                        data["phone"] == preregistration_data["phone"] and
                        data["message"] == preregistration_data["message"]):
                        self.log_test("Course Preregister (Success)", True, f"Pre-registration created successfully with ID: {data.get('id', data.get('_id'))}")
                        return True
                    else:
                        self.log_test("Course Preregister (Success)", False, "Response data doesn't match input data")
                        return False
                else:
                    self.log_test("Course Preregister (Success)", False, f"Missing fields in response: {missing_fields}")
                    return False
            else:
                self.log_test("Course Preregister (Success)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Course Preregister (Success)", False, f"Request error: {str(e)}")
            return False
    
    def test_preregister_course_empty_message(self):
        """Test course pre-registration with empty message (should succeed)"""
        if not self.token:
            self.log_test("Course Preregister (Empty Message)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            preregistration_data = {
                "courseSlug": "tailler-rosiers",
                "firstName": "Jean",
                "lastName": "Martin",
                "email": "jean.martin@example.com",
                "phone": "0987654321",
                "message": ""
            }
            
            response = requests.post(
                f"{self.base_url}/courses/preregister",
                json=preregistration_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get("message") == "":
                    self.log_test("Course Preregister (Empty Message)", True, "Empty message accepted correctly")
                    return True
                else:
                    self.log_test("Course Preregister (Empty Message)", False, "Empty message not handled correctly")
                    return False
            else:
                self.log_test("Course Preregister (Empty Message)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Course Preregister (Empty Message)", False, f"Request error: {str(e)}")
            return False
    
    def test_preregister_invalid_email(self):
        """Test course pre-registration with invalid email (should fail)"""
        if not self.token:
            self.log_test("Course Preregister (Invalid Email)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            preregistration_data = {
                "courseSlug": "vivaces-faciles",
                "firstName": "Pierre",
                "lastName": "Durand",
                "email": "email-invalide",
                "phone": "0123456789",
                "message": "Test avec email invalide"
            }
            
            response = requests.post(
                f"{self.base_url}/courses/preregister",
                json=preregistration_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 422:  # Validation error
                self.log_test("Course Preregister (Invalid Email)", True, "Invalid email correctly rejected with 422")
                return True
            elif response.status_code == 400:
                self.log_test("Course Preregister (Invalid Email)", True, "Invalid email correctly rejected with 400")
                return True
            else:
                self.log_test("Course Preregister (Invalid Email)", False, f"Invalid email accepted - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Course Preregister (Invalid Email)", False, f"Request error: {str(e)}")
            return False
    
    def test_preregister_missing_fields(self):
        """Test course pre-registration with missing required fields (should fail)"""
        if not self.token:
            self.log_test("Course Preregister (Missing Fields)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            # Missing firstName
            incomplete_data = {
                "courseSlug": "tailler-sans-se-tromper",
                "lastName": "Test",
                "email": "test@example.com",
                "phone": "0123456789"
            }
            
            response = requests.post(
                f"{self.base_url}/courses/preregister",
                json=incomplete_data,
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 422:  # Validation error
                self.log_test("Course Preregister (Missing Fields)", True, "Missing fields correctly rejected with 422")
                return True
            elif response.status_code == 400:
                self.log_test("Course Preregister (Missing Fields)", True, "Missing fields correctly rejected with 400")
                return True
            else:
                self.log_test("Course Preregister (Missing Fields)", False, f"Missing fields accepted - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Course Preregister (Missing Fields)", False, f"Request error: {str(e)}")
            return False
    
    def test_preregister_without_auth(self):
        """Test course pre-registration without authentication (should fail)"""
        try:
            preregistration_data = {
                "courseSlug": "massif-fleuri",
                "firstName": "Test",
                "lastName": "NoAuth",
                "email": "noauth@example.com",
                "phone": "0123456789",
                "message": "Test sans auth"
            }
            
            response = requests.post(
                f"{self.base_url}/courses/preregister",
                json=preregistration_data,
                timeout=10
                # No authorization headers
            )
            
            if response.status_code == 401:  # Unauthorized
                self.log_test("Course Preregister (No Auth)", True, "Authentication correctly required (401)")
                return True
            elif response.status_code == 403:
                self.log_test("Course Preregister (No Auth)", True, "Authentication correctly required (403)")
                return True
            else:
                self.log_test("Course Preregister (No Auth)", False, f"Authentication not required - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Course Preregister (No Auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_user_bookings_without_auth(self):
        """Test GET /user/bookings without authentication (should fail with 403)"""
        try:
            response = requests.get(f"{self.base_url}/user/bookings", timeout=10)
            
            if response.status_code == 403:
                self.log_test("User Bookings (No Auth)", True, "Authentication correctly required (403)")
                return True
            elif response.status_code == 401:
                self.log_test("User Bookings (No Auth)", True, "Authentication correctly required (401)")
                return True
            else:
                self.log_test("User Bookings (No Auth)", False, f"Authentication not required - Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("User Bookings (No Auth)", False, f"Request error: {str(e)}")
            return False
    
    def test_user_bookings_empty(self):
        """Test GET /user/bookings with no bookings (should return empty structure)"""
        if not self.token:
            self.log_test("User Bookings (Empty)", False, "No authentication token available")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/bookings",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required structure
                required_keys = ["bookings", "total", "workshops", "courses"]
                if all(key in data for key in required_keys):
                    if (isinstance(data["bookings"], list) and 
                        isinstance(data["total"], int) and 
                        isinstance(data["workshops"], int) and 
                        isinstance(data["courses"], int)):
                        
                        # For empty user, should be all zeros
                        if (data["total"] == 0 and 
                            data["workshops"] == 0 and 
                            data["courses"] == 0 and 
                            len(data["bookings"]) == 0):
                            self.log_test("User Bookings (Empty)", True, "Empty bookings structure correct")
                            return True
                        else:
                            self.log_test("User Bookings (Empty)", True, f"Bookings found: {data['total']} total, {data['workshops']} workshops, {data['courses']} courses")
                            return True
                    else:
                        self.log_test("User Bookings (Empty)", False, f"Invalid data types in response: {data}")
                        return False
                else:
                    missing = [k for k in required_keys if k not in data]
                    self.log_test("User Bookings (Empty)", False, f"Missing required keys: {missing}")
                    return False
            else:
                self.log_test("User Bookings (Empty)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Bookings (Empty)", False, f"Request error: {str(e)}")
            return False
    
    def create_test_bookings_in_db(self):
        """Create test bookings directly in MongoDB for testing"""
        try:
            import pymongo
            from datetime import datetime, timedelta
            import uuid
            
            # Connect to MongoDB
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client["sepalis"]
            
            # Create a workshop booking
            workshop_booking = {
                "_id": str(uuid.uuid4()),
                "workshopSlug": "taille-arbres-fruitiers",
                "workshopTitle": "Apprendre la Taille des Arbres Fruitiers",
                "selectedDate": "2024-03-15",
                "timeSlot": "morning",
                "timeSlotDisplay": "09:00-12:00",
                "participants": 2,
                "firstName": "Marie",
                "lastName": "Dupont",
                "email": TEST_USER_EMAIL,
                "phone": "0123456789",
                "userId": self.user_id,
                "totalAmount": 70.0,
                "paymentStatus": "paid",
                "stripeSessionId": f"cs_test_{uuid.uuid4().hex}",
                "createdAt": datetime.now() - timedelta(days=2),
                "paidAt": datetime.now() - timedelta(days=2)
            }
            
            # Create a course booking
            course_booking = {
                "_id": str(uuid.uuid4()),
                "courseSlug": "massif-fleuri",
                "courseTitle": "Massif Fleuri Toute l'Année",
                "firstName": "Marie",
                "lastName": "Dupont",
                "email": TEST_USER_EMAIL,
                "phone": "0123456789",
                "userId": self.user_id,
                "totalAmount": 39.0,
                "duration": "4 semaines",
                "level": "Tous niveaux",
                "paymentStatus": "paid",
                "stripeSessionId": f"cs_test_{uuid.uuid4().hex}",
                "createdAt": datetime.now() - timedelta(days=1),
                "paidAt": datetime.now() - timedelta(days=1)
            }
            
            # Insert bookings
            db.workshop_bookings.insert_one(workshop_booking)
            db.course_bookings.insert_one(course_booking)
            
            # Store IDs for cleanup
            self.test_workshop_booking_id = workshop_booking["_id"]
            self.test_course_booking_id = course_booking["_id"]
            
            client.close()
            return True
            
        except Exception as e:
            print(f"Error creating test bookings: {str(e)}")
            return False
    
    def cleanup_test_bookings(self):
        """Clean up test bookings from MongoDB"""
        try:
            import pymongo
            
            client = pymongo.MongoClient("mongodb://localhost:27017")
            db = client["sepalis"]
            
            if hasattr(self, 'test_workshop_booking_id'):
                db.workshop_bookings.delete_one({"_id": self.test_workshop_booking_id})
            
            if hasattr(self, 'test_course_booking_id'):
                db.course_bookings.delete_one({"_id": self.test_course_booking_id})
            
            client.close()
            
        except Exception as e:
            print(f"Error cleaning up test bookings: {str(e)}")
    
    def test_user_bookings_with_data(self):
        """Test GET /user/bookings with actual booking data"""
        if not self.token:
            self.log_test("User Bookings (With Data)", False, "No authentication token available")
            return False
        
        # Create test bookings
        if not self.create_test_bookings_in_db():
            self.log_test("User Bookings (With Data)", False, "Failed to create test bookings")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/bookings",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Check structure
                if not all(key in data for key in ["bookings", "total", "workshops", "courses"]):
                    self.log_test("User Bookings (With Data)", False, "Missing required keys in response")
                    return False
                
                # Should have 2 bookings total (1 workshop + 1 course)
                if data["total"] >= 2 and data["workshops"] >= 1 and data["courses"] >= 1:
                    self.log_test("User Bookings (With Data)", True, f"Found bookings: {data['total']} total, {data['workshops']} workshops, {data['courses']} courses")
                    
                    # Check bookings array structure
                    bookings = data["bookings"]
                    if len(bookings) >= 2:
                        # Check workshop booking structure
                        workshop_booking = None
                        course_booking = None
                        
                        for booking in bookings:
                            if booking.get("type") == "workshop":
                                workshop_booking = booking
                            elif booking.get("type") == "course":
                                course_booking = booking
                        
                        # Validate workshop booking structure
                        if workshop_booking:
                            workshop_fields = ["id", "type", "title", "slug", "date", "timeSlot", "timeSlotDisplay", "participants", "totalAmount", "paymentStatus", "createdAt", "paidAt"]
                            missing_workshop_fields = [f for f in workshop_fields if f not in workshop_booking]
                            if missing_workshop_fields:
                                self.log_test("User Bookings (With Data)", False, f"Workshop booking missing fields: {missing_workshop_fields}")
                                return False
                        
                        # Validate course booking structure
                        if course_booking:
                            course_fields = ["id", "type", "title", "slug", "duration", "level", "totalAmount", "paymentStatus", "createdAt", "paidAt"]
                            missing_course_fields = [f for f in course_fields if f not in course_booking]
                            if missing_course_fields:
                                self.log_test("User Bookings (With Data)", False, f"Course booking missing fields: {missing_course_fields}")
                                return False
                        
                        # Check sorting (most recent first)
                        if len(bookings) >= 2:
                            first_date = bookings[0].get("createdAt", "")
                            second_date = bookings[1].get("createdAt", "")
                            if first_date >= second_date:
                                self.log_test("User Bookings (With Data)", True, "Bookings correctly sorted by creation date (most recent first)")
                            else:
                                self.log_test("User Bookings (With Data)", False, f"Incorrect sorting: {first_date} should be >= {second_date}")
                                return False
                        
                        return True
                    else:
                        self.log_test("User Bookings (With Data)", False, f"Expected at least 2 bookings, got {len(bookings)}")
                        return False
                else:
                    self.log_test("User Bookings (With Data)", False, f"Insufficient bookings: total={data['total']}, workshops={data['workshops']}, courses={data['courses']}")
                    return False
            else:
                self.log_test("User Bookings (With Data)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Bookings (With Data)", False, f"Request error: {str(e)}")
            return False
        finally:
            # Clean up test data
            self.cleanup_test_bookings()
    
    def test_user_bookings_data_format(self):
        """Test that booking data is properly formatted"""
        if not self.token:
            self.log_test("User Bookings (Data Format)", False, "No authentication token available")
            return False
        
        # Create test bookings
        if not self.create_test_bookings_in_db():
            self.log_test("User Bookings (Data Format)", False, "Failed to create test bookings")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{self.base_url}/user/bookings",
                headers=headers,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                for booking in data["bookings"]:
                    # Check data types
                    if not isinstance(booking.get("totalAmount"), (int, float)):
                        self.log_test("User Bookings (Data Format)", False, f"totalAmount should be numeric: {booking.get('totalAmount')}")
                        return False
                    
                    if booking.get("type") == "workshop":
                        if not isinstance(booking.get("participants"), int):
                            self.log_test("User Bookings (Data Format)", False, f"participants should be integer: {booking.get('participants')}")
                            return False
                    
                    # Check date formats (should be ISO strings)
                    for date_field in ["createdAt", "paidAt"]:
                        if booking.get(date_field):
                            try:
                                # Try to parse ISO date
                                from datetime import datetime
                                datetime.fromisoformat(booking[date_field].replace('Z', '+00:00'))
                            except ValueError:
                                self.log_test("User Bookings (Data Format)", False, f"Invalid date format for {date_field}: {booking[date_field]}")
                                return False
                
                self.log_test("User Bookings (Data Format)", True, "All booking data properly formatted")
                return True
            else:
                self.log_test("User Bookings (Data Format)", False, f"HTTP {response.status_code}: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("User Bookings (Data Format)", False, f"Request error: {str(e)}")
            return False
        finally:
            # Clean up test data
            self.cleanup_test_bookings()
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"🚀 Starting Sepalis Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Test User: {TEST_USER_EMAIL}")
        print("=" * 60)
        
        # Test sequence - Focus on user bookings endpoint as requested
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register),
            ("User Login", self.test_login),
            ("JWT Authentication", self.test_profile),
            ("Get Courses", self.test_courses),
            ("Courses Image Structure", self.test_courses_image_structure),
            ("Courses Content Validation", self.test_courses_content_validation),
            # User Bookings System Tests (NEW FOCUS)
            ("User Bookings (No Auth)", self.test_user_bookings_without_auth),
            ("User Bookings (Empty)", self.test_user_bookings_empty),
            ("User Bookings (With Data)", self.test_user_bookings_with_data),
            ("User Bookings (Data Format)", self.test_user_bookings_data_format),
            # Course Pre-registration System Tests
            ("Course Preregister (Success)", self.test_preregister_course_success),
            ("Course Preregister (Empty Message)", self.test_preregister_course_empty_message),
            ("Course Preregister (Invalid Email)", self.test_preregister_invalid_email),
            ("Course Preregister (Missing Fields)", self.test_preregister_missing_fields),
            ("Course Preregister (No Auth)", self.test_preregister_without_auth),
            # Other existing tests
            ("Get Plants", self.test_plants),
            ("Get Tasks", self.test_tasks),
            ("JWT Protection (Zones)", self.test_jwt_protection_zones),
            ("Get Zones (Empty)", self.test_zones_empty),
            ("Create Zone", self.test_create_zone),
            ("Get Zone by ID", self.test_get_zone_by_id),
            ("Update Zone", self.test_update_zone),
            ("Get Zones (With Data)", self.test_zones_with_data),
            ("Delete Zone", self.test_delete_zone),
            ("Get Zones (After Delete)", self.test_zones_after_delete),
        ]
        
        passed = 0
        total = len(tests)
        
        for test_name, test_func in tests:
            print(f"\n🧪 Running: {test_name}")
            if test_func():
                passed += 1
        
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {passed}/{total} tests passed")
        
        if passed == total:
            print("🎉 All tests passed! Backend API is working correctly.")
            return True
        else:
            print(f"⚠️  {total - passed} tests failed. Check the details above.")
            return False
    
    def get_summary(self):
        """Get a summary of test results"""
        total = len(self.test_results)
        passed = sum(1 for result in self.test_results if result["success"])
        failed = total - passed
        
        return {
            "total_tests": total,
            "passed": passed,
            "failed": failed,
            "success_rate": f"{(passed/total*100):.1f}%" if total > 0 else "0%",
            "results": self.test_results
        }

def main():
    """Main test execution"""
    tester = SepalisAPITester()
    
    try:
        success = tester.run_all_tests()
        summary = tester.get_summary()
        
        print(f"\n📋 Final Summary:")
        print(f"   Total Tests: {summary['total_tests']}")
        print(f"   Passed: {summary['passed']}")
        print(f"   Failed: {summary['failed']}")
        print(f"   Success Rate: {summary['success_rate']}")
        
        # Save detailed results to file
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())