#!/usr/bin/env python3
"""
Tests critiques avant lancement Play Store - Sécurité Admin et Profil
Focus sur la protection des routes admin et les nouveaux endpoints profil
"""

import asyncio
import httpx
import json
import uuid
from datetime import datetime

# Configuration
BACKEND_URL = "https://garden-backend.preview.emergentagent.com/api"

class SepalisSecurityTester:
    def __init__(self):
        self.backend_url = BACKEND_URL
        self.normal_user_token = None
        self.admin_user_token = None
        self.normal_user_data = None
        self.admin_user_data = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Enregistrer le résultat d'un test"""
        status = "✅ PASS" if success else "❌ FAIL"
        self.test_results.append({
            "test": test_name,
            "status": status,
            "success": success,
            "details": details
        })
        print(f"{status} - {test_name}")
        if details:
            print(f"    {details}")
    
    async def create_normal_user(self):
        """Créer un utilisateur normal de test"""
        try:
            user_data = {
                "email": f"testuser_{uuid.uuid4().hex[:8]}@test.com",
                "password": "TestPassword123!",
                "name": "Test User Normal"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/auth/register",
                    json=user_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.normal_user_token = data["token"]
                    self.normal_user_data = user_data
                    self.log_test("Création utilisateur normal", True, f"Email: {user_data['email']}")
                    return True
                else:
                    self.log_test("Création utilisateur normal", False, f"Status: {response.status_code}, Response: {response.text}")
                    return False
                    
        except Exception as e:
            self.log_test("Création utilisateur normal", False, f"Erreur: {str(e)}")
            return False
    
    async def login_admin_user(self):
        """Tenter de se connecter avec l'utilisateur admin"""
        try:
            # L'utilisateur admin est contact@nicolasblot.com mais nous ne connaissons pas le mot de passe
            # Nous allons d'abord vérifier s'il existe dans la base
            admin_data = {
                "email": "contact@nicolasblot.com",
                "password": "unknown_password"  # Nous ne connaissons pas le mot de passe
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/auth/login",
                    json=admin_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.admin_user_token = data["token"]
                    self.admin_user_data = admin_data
                    self.log_test("Connexion utilisateur admin", True, "Admin connecté avec succès")
                    return True
                else:
                    # Comme nous ne connaissons pas le mot de passe, nous allons créer un utilisateur admin de test
                    self.log_test("Connexion utilisateur admin", False, f"Mot de passe admin inconnu - Status: {response.status_code}")
                    return await self.create_admin_user()
                    
        except Exception as e:
            self.log_test("Connexion utilisateur admin", False, f"Erreur: {str(e)}")
            return await self.create_admin_user()
    
    async def create_admin_user(self):
        """Créer un utilisateur admin de test (pour les tests uniquement)"""
        try:
            # Créer un utilisateur normal d'abord
            admin_data = {
                "email": f"admin_test_{uuid.uuid4().hex[:8]}@test.com",
                "password": "AdminPassword123!",
                "name": "Test Admin User"
            }
            
            async with httpx.AsyncClient() as client:
                # Créer l'utilisateur
                response = await client.post(
                    f"{self.backend_url}/auth/register",
                    json=admin_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    self.admin_user_token = data["token"]
                    self.admin_user_data = admin_data
                    
                    # Note: Dans un vrai environnement, nous devrions modifier la base de données
                    # pour ajouter isAdmin: true à cet utilisateur, mais pour les tests
                    # nous allons utiliser l'utilisateur normal et documenter le problème
                    self.log_test("Création utilisateur admin de test", True, f"Email: {admin_data['email']} (Note: isAdmin doit être ajouté manuellement en DB)")
                    return True
                else:
                    self.log_test("Création utilisateur admin de test", False, f"Status: {response.status_code}")
                    return False
                    
        except Exception as e:
            self.log_test("Création utilisateur admin de test", False, f"Erreur: {str(e)}")
            return False
    
    async def test_admin_routes_with_normal_user(self):
        """Tester l'accès aux routes admin avec un utilisateur normal (doit échouer)"""
        if not self.normal_user_token:
            self.log_test("Test routes admin - utilisateur normal", False, "Pas de token utilisateur normal")
            return
        
        headers = {"Authorization": f"Bearer {self.normal_user_token}"}
        
        admin_routes = [
            ("GET", "/admin/season-tips", None),
            ("POST", "/admin/calendar-tasks", {
                "title": "Test Task",
                "description": "Test Description", 
                "weekNumber": 1,
                "taskType": "general",
                "priority": "optionnel"
            }),
            ("GET", "/admin/quiz/questions", None),
            ("GET", "/admin/analytics/overview", None),
            ("POST", "/admin/messages/broadcast", {
                "title": "Test Message",
                "content": "Test Content",
                "targetAudience": "all"
            }),
            ("POST", "/admin/blog/articles", {
                "title": "Test Article",
                "content": "Test Content",
                "category": "general"
            })
        ]
        
        forbidden_count = 0
        total_routes = len(admin_routes)
        
        async with httpx.AsyncClient() as client:
            for method, route, data in admin_routes:
                try:
                    if method == "GET":
                        response = await client.get(
                            f"{self.backend_url}{route}",
                            headers=headers,
                            timeout=30.0
                        )
                    else:  # POST
                        response = await client.post(
                            f"{self.backend_url}{route}",
                            headers=headers,
                            json=data,
                            timeout=30.0
                        )
                    
                    if response.status_code == 403:
                        forbidden_count += 1
                        self.log_test(f"Route admin {method} {route} - utilisateur normal", True, "403 Forbidden (correct)")
                    else:
                        self.log_test(f"Route admin {method} {route} - utilisateur normal", False, f"Status: {response.status_code} (devrait être 403)")
                        
                except Exception as e:
                    self.log_test(f"Route admin {method} {route} - utilisateur normal", False, f"Erreur: {str(e)}")
        
        # Résumé de sécurité
        if forbidden_count == total_routes:
            self.log_test("🔒 SÉCURITÉ ADMIN - Protection complète", True, f"Toutes les {total_routes} routes admin protégées contre utilisateurs normaux")
        else:
            self.log_test("🚨 SÉCURITÉ ADMIN - Faille critique", False, f"Seulement {forbidden_count}/{total_routes} routes protégées")
    
    async def test_admin_routes_with_admin_user(self):
        """Tester l'accès aux routes admin avec l'utilisateur admin (doit fonctionner)"""
        if not self.admin_user_token:
            self.log_test("Test routes admin - utilisateur admin", False, "Pas de token utilisateur admin")
            return
        
        headers = {"Authorization": f"Bearer {self.admin_user_token}"}
        
        # Test simple avec GET /admin/season-tips
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/admin/season-tips",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    self.log_test("Route admin GET /admin/season-tips - utilisateur admin", True, "200 OK (accès autorisé)")
                elif response.status_code == 403:
                    self.log_test("Route admin GET /admin/season-tips - utilisateur admin", False, "403 Forbidden (utilisateur test n'a pas isAdmin=true)")
                else:
                    self.log_test("Route admin GET /admin/season-tips - utilisateur admin", False, f"Status: {response.status_code}")
                    
        except Exception as e:
            self.log_test("Route admin GET /admin/season-tips - utilisateur admin", False, f"Erreur: {str(e)}")
    
    async def test_profile_endpoints(self):
        """Tester les nouveaux endpoints de profil"""
        if not self.normal_user_token:
            self.log_test("Test endpoints profil", False, "Pas de token utilisateur")
            return
        
        headers = {"Authorization": f"Bearer {self.normal_user_token}"}
        
        # Test GET /api/user/profile
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.backend_url}/user/profile",
                    headers=headers,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if "firstName" in data or "lastName" in data or "email" in data:
                        self.log_test("GET /api/user/profile", True, f"Profil récupéré: {list(data.keys())}")
                    else:
                        self.log_test("GET /api/user/profile", False, f"Structure inattendue: {data}")
                else:
                    self.log_test("GET /api/user/profile", False, f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            self.log_test("GET /api/user/profile", False, f"Erreur: {str(e)}")
        
        # Test PUT /api/user/profile
        try:
            profile_update = {
                "firstName": "Test",
                "lastName": "User"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.backend_url}/user/profile",
                    headers=headers,
                    json=profile_update,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    self.log_test("PUT /api/user/profile", True, "Profil mis à jour avec succès")
                else:
                    self.log_test("PUT /api/user/profile", False, f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            self.log_test("PUT /api/user/profile", False, f"Erreur: {str(e)}")
        
        # Test POST /api/user/change-password
        try:
            password_change = {
                "currentPassword": self.normal_user_data["password"],
                "newPassword": "NewPassword123!"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/user/change-password",
                    headers=headers,
                    json=password_change,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    self.log_test("POST /api/user/change-password", True, "Mot de passe changé avec succès")
                else:
                    self.log_test("POST /api/user/change-password", False, f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            self.log_test("POST /api/user/change-password", False, f"Erreur: {str(e)}")
        
        # Test POST /api/user/support-message
        try:
            support_message = {
                "subject": "Test Support",
                "message": "Message de test pour le support"
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.backend_url}/user/support-message",
                    headers=headers,
                    json=support_message,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    self.log_test("POST /api/user/support-message", True, "Message de support envoyé avec succès")
                else:
                    self.log_test("POST /api/user/support-message", False, f"Status: {response.status_code}, Response: {response.text}")
                    
        except Exception as e:
            self.log_test("POST /api/user/support-message", False, f"Erreur: {str(e)}")
    
    async def run_all_tests(self):
        """Exécuter tous les tests critiques"""
        print("🎯 TESTS CRITIQUES AVANT LANCEMENT PLAY STORE")
        print("=" * 60)
        print(f"Backend URL: {self.backend_url}")
        print(f"Timestamp: {datetime.now().isoformat()}")
        print()
        
        # Phase 1: Création des utilisateurs
        print("📋 PHASE 1: PRÉPARATION DES UTILISATEURS")
        await self.create_normal_user()
        await self.login_admin_user()
        print()
        
        # Phase 2: Tests de sécurité admin (CRITIQUE)
        print("🔒 PHASE 2: TESTS SÉCURITÉ ADMIN (CRITIQUE)")
        await self.test_admin_routes_with_normal_user()
        await self.test_admin_routes_with_admin_user()
        print()
        
        # Phase 3: Tests endpoints profil
        print("👤 PHASE 3: TESTS ENDPOINTS PROFIL")
        await self.test_profile_endpoints()
        print()
        
        # Résumé final
        self.print_summary()
    
    def print_summary(self):
        """Afficher le résumé des tests"""
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        success_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total des tests: {total_tests}")
        print(f"Tests réussis: {passed_tests}")
        print(f"Tests échoués: {failed_tests}")
        print(f"Taux de réussite: {success_rate:.1f}%")
        print()
        
        # Tests échoués (priorité)
        failed_results = [r for r in self.test_results if not r["success"]]
        if failed_results:
            print("❌ TESTS ÉCHOUÉS (ATTENTION REQUISE):")
            for result in failed_results:
                print(f"  • {result['test']}")
                if result['details']:
                    print(f"    {result['details']}")
            print()
        
        # Tests réussis
        passed_results = [r for r in self.test_results if r["success"]]
        if passed_results:
            print("✅ TESTS RÉUSSIS:")
            for result in passed_results:
                print(f"  • {result['test']}")
            print()
        
        # Recommandations
        print("🎯 RECOMMANDATIONS:")
        if failed_tests == 0:
            print("  ✅ Tous les tests sont passés - Application prête pour le lancement")
        else:
            critical_security_failed = any("SÉCURITÉ ADMIN" in r["test"] and not r["success"] for r in self.test_results)
            if critical_security_failed:
                print("  🚨 CRITIQUE: Problème de sécurité admin détecté - CORRECTION URGENTE REQUISE")
            print(f"  ⚠️  {failed_tests} test(s) échoué(s) - Vérification nécessaire avant lancement")

async def main():
    """Point d'entrée principal"""
    tester = SepalisSecurityTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())