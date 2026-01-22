#!/usr/bin/env python3
"""
Tests spécifiques pour le fix du schema mismatch zones (drainage vs humidity)
Focus sur les endpoints de zones avec le champ 'humidity'
"""

import requests
import json
import uuid
from datetime import datetime
import sys

# Configuration
BASE_URL = "https://sepalis-app-1.preview.emergentagent.com/api"
TEST_USER_EMAIL = "marie.jardiniere@sepalis.fr"
TEST_USER_PASSWORD = "MotDePasse2024!"
TEST_USER_NAME = "Marie Jardinière"

class ZoneHumidityTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.user_id = None
        self.created_zones = []
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Enregistrer le résultat d'un test"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   {details}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
    
    def authenticate(self):
        """S'authentifier ou créer un utilisateur de test"""
        print("\n🔐 AUTHENTIFICATION")
        
        # Essayer de se connecter d'abord
        login_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/login", json=login_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_id = data["user"]["id"]
                self.log_test("Connexion utilisateur existant", True, f"User ID: {self.user_id}")
                return True
        except Exception as e:
            print(f"Connexion échouée: {e}")
        
        # Si la connexion échoue, créer un nouvel utilisateur
        register_data = {
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD,
            "name": TEST_USER_NAME
        }
        
        try:
            response = requests.post(f"{self.base_url}/auth/register", json=register_data, timeout=10)
            if response.status_code == 200:
                data = response.json()
                self.token = data["token"]
                self.user_id = data["user"]["id"]
                self.log_test("Création nouvel utilisateur", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_test("Authentification", False, f"Status: {response.status_code}, Response: {response.text}")
                return False
        except Exception as e:
            self.log_test("Authentification", False, f"Erreur: {str(e)}")
            return False
    
    def get_headers(self):
        """Obtenir les headers avec le token d'authentification"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_create_zone_with_humidity_normal(self):
        """Test POST /api/user/zones - Création avec humidity='Normal'"""
        print("\n🌱 TEST CRITIQUE 1: Création zone avec humidity='Normal'")
        
        zone_data = {
            "name": "Potager Test",
            "type": "Potager",
            "length": 10.0,
            "width": 5.0,
            "area": 50.0,
            "soilType": "Argileux",
            "soilPH": "Neutre (6.5-7.5)",
            "humidity": "Normal",  # CHAMP CRITIQUE
            "sunExposure": "Plein soleil",
            "climateZone": "Océanique",
            "windProtection": "Protégé",
            "wateringSystem": "Manuel",
            "notes": "Test zone",
            "color": "#4CAF50"
        }
        
        try:
            response = requests.post(f"{self.base_url}/user/zones", json=zone_data, headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                created_zone = response.json()
                
                # Vérifications critiques
                zone_id = created_zone.get("_id") or created_zone.get("id")
                if (created_zone.get("humidity") == "Normal" and 
                    "drainage" not in created_zone and
                    created_zone.get("name") == zone_data["name"] and
                    zone_id):
                    
                    created_zone["id"] = zone_id  # Normaliser l'ID
                    self.created_zones.append(created_zone)
                    self.log_test("POST /api/user/zones (humidity=Normal)", True, 
                                f"Zone créée avec succès. ID: {zone_id}")
                    return created_zone
                else:
                    self.log_test("POST /api/user/zones (humidity=Normal)", False, 
                                f"Données incorrectes: humidity={created_zone.get('humidity')}, drainage présent={('drainage' in created_zone)}")
                    return None
            else:
                error_detail = f"Status: {response.status_code}"
                try:
                    error_data = response.json()
                    error_detail += f", Error: {error_data}"
                except:
                    error_detail += f", Response: {response.text}"
                
                self.log_test("POST /api/user/zones (humidity=Normal)", False, error_detail)
                return None
                
        except Exception as e:
            self.log_test("POST /api/user/zones (humidity=Normal)", False, f"Erreur: {str(e)}")
            return None
    
    def test_create_zone_with_humidity_humide(self):
        """Test POST /api/user/zones - Création avec humidity='Humide'"""
        print("\n💧 TEST CRITIQUE 2: Création zone avec humidity='Humide'")
        
        zone_data = {
            "name": "Jardin Humide",
            "type": "Ornemental",
            "length": 8.0,
            "width": 4.0,
            "area": 32.0,
            "soilType": "Limoneux",
            "soilPH": "Acide (5.5-6.0)",
            "humidity": "Humide",  # CHAMP CRITIQUE - valeur différente
            "sunExposure": "Mi-ombre",
            "climateZone": "Continental",
            "windProtection": "Exposé",
            "wateringSystem": "Goutte à goutte",
            "notes": "Zone pour plantes d'ombre humide",
            "color": "#2196F3"
        }
        
        try:
            response = requests.post(f"{self.base_url}/user/zones", json=zone_data, headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                created_zone = response.json()
                
                zone_id = created_zone.get("_id") or created_zone.get("id")
                if (created_zone.get("humidity") == "Humide" and 
                    "drainage" not in created_zone and zone_id):
                    
                    created_zone["id"] = zone_id  # Normaliser l'ID
                    self.created_zones.append(created_zone)
                    self.log_test("POST /api/user/zones (humidity=Humide)", True, 
                                f"Zone créée. Humidity: {created_zone.get('humidity')}")
                    return created_zone
                else:
                    self.log_test("POST /api/user/zones (humidity=Humide)", False, 
                                f"Humidity incorrect ou drainage présent")
                    return None
            else:
                self.log_test("POST /api/user/zones (humidity=Humide)", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("POST /api/user/zones (humidity=Humide)", False, f"Erreur: {str(e)}")
            return None
    
    def test_create_zone_with_humidity_sec(self):
        """Test POST /api/user/zones - Création avec humidity='Sec'"""
        print("\n🏜️ TEST CRITIQUE 3: Création zone avec humidity='Sec'")
        
        zone_data = {
            "name": "Rocaille Sèche",
            "type": "Ornemental",
            "length": 6.0,
            "width": 3.0,
            "area": 18.0,
            "soilType": "Sableux",
            "soilPH": "Basique (7.5-8.0)",
            "humidity": "Sec",  # CHAMP CRITIQUE - troisième valeur
            "sunExposure": "Plein soleil",
            "climateZone": "Méditerranéen",
            "windProtection": "Exposé",
            "wateringSystem": "Aucun",
            "notes": "Rocaille pour plantes résistantes à la sécheresse",
            "color": "#FF9800"
        }
        
        try:
            response = requests.post(f"{self.base_url}/user/zones", json=zone_data, headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                created_zone = response.json()
                
                zone_id = created_zone.get("_id") or created_zone.get("id")
                if (created_zone.get("humidity") == "Sec" and 
                    "drainage" not in created_zone and zone_id):
                    
                    created_zone["id"] = zone_id  # Normaliser l'ID
                    self.created_zones.append(created_zone)
                    self.log_test("POST /api/user/zones (humidity=Sec)", True, 
                                f"Zone créée. Humidity: {created_zone.get('humidity')}")
                    return created_zone
                else:
                    self.log_test("POST /api/user/zones (humidity=Sec)", False, 
                                f"Humidity incorrect ou drainage présent")
                    return None
            else:
                self.log_test("POST /api/user/zones (humidity=Sec)", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("POST /api/user/zones (humidity=Sec)", False, f"Erreur: {str(e)}")
            return None
    
    def test_get_zones_list(self):
        """Test GET /api/user/zones - Vérifier que toutes les zones sont listées avec humidity"""
        print("\n📋 TEST: Récupération liste zones avec champ humidity")
        
        try:
            response = requests.get(f"{self.base_url}/user/zones", headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                zones = response.json()
                
                if isinstance(zones, list) and len(zones) >= len(self.created_zones):
                    # Vérifier que toutes les zones ont le champ humidity
                    all_have_humidity = all("humidity" in zone for zone in zones)
                    no_drainage = all("drainage" not in zone for zone in zones)
                    
                    if all_have_humidity and no_drainage:
                        humidity_values = [zone.get("humidity") for zone in zones]
                        self.log_test("GET /api/user/zones (avec humidity)", True, 
                                    f"{len(zones)} zone(s), humidity values: {humidity_values}")
                        return zones
                    else:
                        self.log_test("GET /api/user/zones (avec humidity)", False, 
                                    f"Champs manquants: humidity={all_have_humidity}, no_drainage={no_drainage}")
                        return None
                else:
                    self.log_test("GET /api/user/zones (avec humidity)", False, 
                                f"Liste incorrecte: {len(zones) if isinstance(zones, list) else 'not list'}")
                    return None
            else:
                self.log_test("GET /api/user/zones (avec humidity)", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("GET /api/user/zones (avec humidity)", False, f"Erreur: {str(e)}")
            return None
    
    def test_get_zone_by_id(self, zone_id):
        """Test GET /api/user/zones/{id} - Vérifier récupération avec humidity"""
        print(f"\n🔍 TEST: Récupération zone par ID avec humidity")
        
        try:
            response = requests.get(f"{self.base_url}/user/zones/{zone_id}", headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                zone = response.json()
                
                actual_id = zone.get("_id") or zone.get("id")
                if ("humidity" in zone and 
                    "drainage" not in zone and 
                    actual_id == zone_id):
                    
                    self.log_test("GET /api/user/zones/{id} (avec humidity)", True, 
                                f"Zone: {zone.get('name')}, Humidity: {zone.get('humidity')}")
                    return zone
                else:
                    self.log_test("GET /api/user/zones/{id} (avec humidity)", False, 
                                f"Champs incorrects dans la réponse")
                    return None
            else:
                self.log_test("GET /api/user/zones/{id} (avec humidity)", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("GET /api/user/zones/{id} (avec humidity)", False, f"Erreur: {str(e)}")
            return None
    
    def test_update_zone_humidity(self, zone_id):
        """Test PUT /api/user/zones/{id} - Mise à jour du champ humidity"""
        print(f"\n✏️ TEST: Mise à jour champ humidity")
        
        update_data = {
            "name": "Potager Test - Modifié",
            "type": "Potager",
            "length": 12.0,
            "width": 6.0,
            "area": 72.0,
            "soilType": "Argileux enrichi",
            "soilPH": "Neutre (6.5-7.5)",
            "humidity": "Humide",  # CHANGEMENT: Normal -> Humide
            "sunExposure": "Plein soleil",
            "climateZone": "Océanique",
            "windProtection": "Bien protégé",
            "wateringSystem": "Goutte à goutte",
            "notes": "Zone modifiée avec nouveau système d'irrigation",
            "color": "#2E7D32"
        }
        
        try:
            response = requests.put(f"{self.base_url}/user/zones/{zone_id}", 
                                  json=update_data, headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                updated_zone = response.json()
                
                updated_id = updated_zone.get("_id") or updated_zone.get("id")
                if (updated_zone.get("humidity") == "Humide" and 
                    updated_zone.get("name") == update_data["name"] and
                    "drainage" not in updated_zone and
                    updated_id == zone_id):
                    
                    self.log_test("PUT /api/user/zones/{id} (humidity update)", True, 
                                f"Humidity mis à jour: {updated_zone.get('humidity')}")
                    return updated_zone
                else:
                    self.log_test("PUT /api/user/zones/{id} (humidity update)", False, 
                                f"Mise à jour incorrecte")
                    return None
            else:
                self.log_test("PUT /api/user/zones/{id} (humidity update)", False, f"Status: {response.status_code}")
                return None
        except Exception as e:
            self.log_test("PUT /api/user/zones/{id} (humidity update)", False, f"Erreur: {str(e)}")
            return None
    
    def test_delete_zone(self, zone_id):
        """Test DELETE /api/user/zones/{id}"""
        print(f"\n🗑️ TEST: Suppression zone")
        
        try:
            response = requests.delete(f"{self.base_url}/user/zones/{zone_id}", headers=self.get_headers(), timeout=10)
            
            if response.status_code == 200:
                # Vérifier suppression
                verify_response = requests.get(f"{self.base_url}/user/zones/{zone_id}", headers=self.get_headers(), timeout=10)
                
                if verify_response.status_code == 404:
                    self.log_test("DELETE /api/user/zones/{id}", True, "Zone supprimée avec succès")
                    return True
                else:
                    self.log_test("DELETE /api/user/zones/{id}", False, "Zone pas supprimée")
                    return False
            else:
                self.log_test("DELETE /api/user/zones/{id}", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("DELETE /api/user/zones/{id}", False, f"Erreur: {str(e)}")
            return False
    
    def run_humidity_tests(self):
        """Exécuter tous les tests spécifiques au champ humidity"""
        print("🧪 TESTS SPÉCIFIQUES CHAMP HUMIDITY - FIX SCHEMA MISMATCH")
        print("=" * 70)
        
        # 1. Authentification
        if not self.authenticate():
            print("❌ ÉCHEC AUTHENTIFICATION - ARRÊT DES TESTS")
            return False
        
        # 2. Tests de création avec différentes valeurs de humidity
        zone_normal = self.test_create_zone_with_humidity_normal()
        zone_humide = self.test_create_zone_with_humidity_humide()
        zone_sec = self.test_create_zone_with_humidity_sec()
        
        # Vérifier qu'au moins une zone a été créée
        if not any([zone_normal, zone_humide, zone_sec]):
            print("❌ ÉCHEC CRITIQUE - Aucune zone créée avec le champ humidity")
            return False
        
        # 3. Test récupération liste
        self.test_get_zones_list()
        
        # 4. Test récupération par ID
        if zone_normal:
            self.test_get_zone_by_id(zone_normal["id"])
        
        # 5. Test mise à jour du champ humidity
        if zone_normal:
            self.test_update_zone_humidity(zone_normal["id"])
        
        # 6. Test suppression (nettoyer)
        for zone in [zone_humide, zone_sec]:
            if zone:
                self.test_delete_zone(zone["id"])
        
        # Résumé
        self.print_summary()
        return True
    
    def print_summary(self):
        """Afficher le résumé des tests"""
        print("\n" + "=" * 70)
        print("📊 RÉSUMÉ TESTS CHAMP HUMIDITY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"Total: {total_tests} tests")
        print(f"✅ Réussis: {passed_tests}")
        print(f"❌ Échoués: {failed_tests}")
        print(f"📈 Taux de réussite: {(passed_tests/total_tests)*100:.1f}%")
        
        # Tests critiques pour le fix
        critical_tests = [
            "POST /api/user/zones (humidity=Normal)",
            "POST /api/user/zones (humidity=Humide)", 
            "POST /api/user/zones (humidity=Sec)"
        ]
        
        critical_passed = sum(1 for result in self.test_results 
                            if result["test"] in critical_tests and result["success"])
        
        print(f"\n🎯 RÉSULTAT FIX SCHEMA MISMATCH:")
        if critical_passed >= 2:  # Au moins 2 des 3 valeurs de humidity fonctionnent
            print("   ✅ FIX RÉUSSI - Le champ 'humidity' est accepté par le backend")
            print("   ✅ Le champ 'drainage' n'est plus requis")
        else:
            print("   ❌ FIX INCOMPLET - Problèmes persistants avec le champ 'humidity'")
        
        if failed_tests > 0:
            print(f"\n❌ DÉTAILS DES ÉCHECS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        return passed_tests, failed_tests

def main():
    """Fonction principale"""
    tester = ZoneHumidityTester()
    
    try:
        success = tester.run_humidity_tests()
        
        if success:
            passed, failed = tester.print_summary()
            
            if failed == 0:
                print("\n🎉 TOUS LES TESTS HUMIDITY SONT PASSÉS!")
                print("✅ Le fix du schema mismatch est FONCTIONNEL")
                sys.exit(0)
            else:
                print(f"\n⚠️ {failed} TEST(S) ÉCHOUÉ(S)")
                sys.exit(1)
        else:
            print("\n💥 ÉCHEC CRITIQUE DES TESTS HUMIDITY")
            sys.exit(2)
            
    except KeyboardInterrupt:
        print("\n\n⏹️ Tests interrompus par l'utilisateur")
        sys.exit(3)
    except Exception as e:
        print(f"\n💥 ERREUR INATTENDUE: {str(e)}")
        sys.exit(4)

if __name__ == "__main__":
    main()