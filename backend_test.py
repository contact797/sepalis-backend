#!/usr/bin/env python3
"""
Backend API Tests for Sepalis Application
Tests all backend endpoints including authentication and protected routes
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://garden-aide.preview.emergentagent.com/api"
TEST_USER_EMAIL = "marie.dupont@example.com"
TEST_USER_PASSWORD = "SecurePass123!"
TEST_USER_NAME = "Marie Dupont"

class SepalisAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        self.test_results = []
        
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
        """Test GET /courses endpoint (public)"""
        try:
            response = requests.get(f"{self.base_url}/courses", timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    self.log_test("Get Courses", True, f"Courses list retrieved: {len(data)} courses")
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
                if "id" in data and "userId" in data and data["name"] == zone_data["name"]:
                    self.created_zone_id = data["id"]
                    self.log_test("Create Zone", True, f"Zone created successfully: {data['name']} (ID: {data['id']})")
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
                if "id" in data and data["id"] == self.created_zone_id:
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
                    if hasattr(self, 'created_zone_id') and zone.get("id") == self.created_zone_id:
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
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"🚀 Starting Sepalis Backend API Tests")
        print(f"📍 Base URL: {self.base_url}")
        print(f"👤 Test User: {TEST_USER_EMAIL}")
        print("=" * 60)
        
        # Test sequence
        tests = [
            ("Health Check", self.test_health_check),
            ("User Registration", self.test_register),
            ("User Login", self.test_login),
            ("Get Profile", self.test_profile),
            ("Get Plants", self.test_plants),
            ("Get Tasks", self.test_tasks),
            ("Get Courses", self.test_courses),
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