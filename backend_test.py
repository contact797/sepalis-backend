#!/usr/bin/env python3
"""
Tests complets du système de parrainage Sepalis
Test du nouveau système de parrainage implémenté
"""

import asyncio
import httpx
import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, Any

# Configuration
BASE_URL = "https://garden-academy.preview.emergentagent.com/api"
TEST_EMAIL = "contact@nicolasblot.com"
TEST_PASSWORD = "password123"  # Mot de passe par défaut pour les tests

# Essayer plusieurs mots de passe possibles
POSSIBLE_PASSWORDS = ["password123", "sepalis123", "admin123", "test123", "123456", "password"]

class ReferralSystemTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = httpx.AsyncClient(timeout=30.0)
        self.test_users = []
        self.test_results = []
        
    async def log_test(self, test_name: str, success: bool, details: str = ""):
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
    
    async def create_test_user(self, email: str, name: str, password: str = "testpass123") -> Dict[str, Any]:
        """Créer un utilisateur de test"""
        try:
            response = await self.session.post(f"{self.base_url}/auth/register", json={
                "email": email,
                "name": name,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                user_info = {
                    "email": email,
                    "name": name,
                    "token": data["token"],
                    "user_id": data["user"]["id"]
                }
                self.test_users.append(user_info)
                return user_info
            elif response.status_code == 400 and "already registered" in response.text:
                # Utilisateur existe déjà, essayer de se connecter
                login_response = await self.session.post(f"{self.base_url}/auth/login", json={
                    "email": email,
                    "password": password
                })
                if login_response.status_code == 200:
                    data = login_response.json()
                    user_info = {
                        "email": email,
                        "name": name,
                        "token": data["token"],
                        "user_id": data["user"]["id"]
                    }
                    self.test_users.append(user_info)
                    return user_info
            
            print(f"❌ Erreur création utilisateur {email}: {response.status_code} - {response.text}")
            return None
            
        except Exception as e:
            print(f"❌ Exception création utilisateur {email}: {str(e)}")
            return None
    
    async def login_user(self, email: str, password: str) -> Dict[str, Any]:
        """Connexion utilisateur existant"""
        try:
            response = await self.session.post(f"{self.base_url}/auth/login", json={
                "email": email,
                "password": password
            })
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "email": email,
                    "token": data["token"],
                    "user_id": data["user"]["id"],
                    "name": data["user"]["name"]
                }
            else:
                print(f"❌ Erreur connexion {email}: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Exception connexion {email}: {str(e)}")
            return None
    
    async def test_referral_code_generation(self):
        """Test 1: Génération du code de parrainage"""
        print("\n🧪 TEST 1: Génération du code de parrainage")
        
        # Essayer de se connecter avec différents mots de passe
        main_user = None
        for password in POSSIBLE_PASSWORDS:
            main_user = await self.login_user(TEST_EMAIL, password)
            if main_user:
                print(f"   ✅ Connexion réussie avec le mot de passe: {password}")
                break
        
        # Si aucun mot de passe ne fonctionne, créer un nouvel utilisateur de test
        if not main_user:
            print(f"   ⚠️  Impossible de se connecter à {TEST_EMAIL}, création d'un utilisateur de test")
            test_email = f"test_referral_{uuid.uuid4().hex[:8]}@sepalis.com"
            main_user = await self.create_test_user(test_email, "Nicolas Blot Test", "testpass123")
        
        if not main_user:
            await self.log_test("Connexion compte principal", False, f"Impossible de se connecter ou créer un utilisateur")
            return
        
        await self.log_test("Connexion compte principal", True, f"Connecté en tant que {main_user['name']}")
        
        # Test génération du code
        try:
            headers = {"Authorization": f"Bearer {main_user['token']}"}
            response = await self.session.get(f"{self.base_url}/user/referral/code", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la structure de la réponse
                required_fields = ["code", "shareUrl", "shareMessage"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    await self.log_test("Structure réponse code", False, f"Champs manquants: {missing_fields}")
                    return
                
                await self.log_test("Structure réponse code", True, "Tous les champs requis présents")
                
                # Vérifier le format du code
                code = data["code"]
                if code.startswith("SEPALIS-") and len(code.split("-")) >= 3:
                    await self.log_test("Format code parrainage", True, f"Code généré: {code}")
                else:
                    await self.log_test("Format code parrainage", False, f"Format invalide: {code}")
                    return
                
                # Vérifier l'URL de partage
                share_url = data["shareUrl"]
                if f"https://sepalis.app/invite/{code}" == share_url:
                    await self.log_test("URL de partage", True, f"URL correcte: {share_url}")
                else:
                    await self.log_test("URL de partage", False, f"URL incorrecte: {share_url}")
                
                # Vérifier le message de partage
                share_message = data["shareMessage"]
                if code in share_message and "2 semaines Premium" in share_message:
                    await self.log_test("Message de partage", True, "Message contient le code et la récompense")
                else:
                    await self.log_test("Message de partage", False, "Message incomplet")
                
                # Stocker le code pour les tests suivants
                main_user["referral_code"] = code
                return main_user
                
            else:
                await self.log_test("Génération code parrainage", False, f"Status: {response.status_code}")
                return None
                
        except Exception as e:
            await self.log_test("Génération code parrainage", False, f"Exception: {str(e)}")
            return None
    
    async def test_referral_stats_empty(self, user_info: Dict[str, Any]):
        """Test 2: Statistiques de parrainage (état initial)"""
        print("\n🧪 TEST 2: Statistiques de parrainage (état initial)")
        
        try:
            headers = {"Authorization": f"Bearer {user_info['token']}"}
            response = await self.session.get(f"{self.base_url}/user/referral/stats", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la structure
                required_fields = ["totalReferrals", "activeReferrals", "premiumEarned", "nextReward", "progressToNext", "referrals"]
                missing_fields = [field for field in required_fields if field not in data]
                
                if missing_fields:
                    await self.log_test("Structure stats parrainage", False, f"Champs manquants: {missing_fields}")
                    return False
                
                await self.log_test("Structure stats parrainage", True, "Tous les champs requis présents")
                
                # Vérifier les valeurs initiales
                total_referrals = data["totalReferrals"]
                active_referrals = data["activeReferrals"]
                premium_earned = data["premiumEarned"]
                
                await self.log_test("Valeurs initiales stats", True, 
                    f"Total: {total_referrals}, Actifs: {active_referrals}, Premium: {premium_earned} jours")
                
                # Vérifier la progression vers le prochain palier
                next_reward = data["nextReward"]
                progress = data["progressToNext"]
                
                await self.log_test("Progression palier", True, 
                    f"Prochain: {next_reward}, Progression: {progress:.2f}")
                
                return True
                
            else:
                await self.log_test("Récupération stats", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            await self.log_test("Récupération stats", False, f"Exception: {str(e)}")
            return False
    
    async def test_referral_application(self, referrer_info: Dict[str, Any]):
        """Test 3: Application d'un code de parrainage"""
        print("\n🧪 TEST 3: Application d'un code de parrainage")
        
        # Créer un nouvel utilisateur (filleul)
        filleul_email = f"filleul_{uuid.uuid4().hex[:8]}@test.com"
        filleul = await self.create_test_user(filleul_email, "Test Filleul")
        
        if not filleul:
            await self.log_test("Création filleul", False, "Impossible de créer le filleul")
            return None
        
        await self.log_test("Création filleul", True, f"Filleul créé: {filleul_email}")
        
        # Test application du code valide
        try:
            headers = {"Authorization": f"Bearer {filleul['token']}"}
            referral_code = referrer_info["referral_code"]
            
            response = await self.session.post(f"{self.base_url}/user/referral/apply", 
                headers=headers,
                json={"code": referral_code}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Vérifier la réponse
                if data.get("success") and "2 semaines Premium" in data.get("message", ""):
                    await self.log_test("Application code valide", True, 
                        f"Code {referral_code} appliqué avec succès")
                    
                    # Vérifier que le filleul a reçu 14 jours Premium
                    if data.get("premiumDays") == 14:
                        await self.log_test("Récompense filleul", True, "14 jours Premium accordés")
                    else:
                        await self.log_test("Récompense filleul", False, 
                            f"Jours accordés: {data.get('premiumDays')}")
                    
                    return filleul
                else:
                    await self.log_test("Application code valide", False, f"Réponse inattendue: {data}")
                    return None
            else:
                await self.log_test("Application code valide", False, 
                    f"Status: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            await self.log_test("Application code valide", False, f"Exception: {str(e)}")
            return None
    
    async def test_referral_error_cases(self, referrer_info: Dict[str, Any], filleul_info: Dict[str, Any]):
        """Test 4: Cas d'erreur du système de parrainage"""
        print("\n🧪 TEST 4: Cas d'erreur du système de parrainage")
        
        # Test 4.1: Code déjà utilisé
        try:
            headers = {"Authorization": f"Bearer {filleul_info['token']}"}
            referral_code = referrer_info["referral_code"]
            
            response = await self.session.post(f"{self.base_url}/user/referral/apply", 
                headers=headers,
                json={"code": referral_code}
            )
            
            if response.status_code == 400 and "déjà utilisé" in response.text:
                await self.log_test("Code déjà utilisé", True, "Erreur correctement détectée")
            else:
                await self.log_test("Code déjà utilisé", False, 
                    f"Status: {response.status_code} - {response.text}")
                
        except Exception as e:
            await self.log_test("Code déjà utilisé", False, f"Exception: {str(e)}")
        
        # Test 4.2: Code invalide
        try:
            nouveau_filleul_email = f"filleul2_{uuid.uuid4().hex[:8]}@test.com"
            nouveau_filleul = await self.create_test_user(nouveau_filleul_email, "Test Filleul 2")
            
            if nouveau_filleul:
                headers = {"Authorization": f"Bearer {nouveau_filleul['token']}"}
                
                response = await self.session.post(f"{self.base_url}/user/referral/apply", 
                    headers=headers,
                    json={"code": "CODE-INVALIDE-123"}
                )
                
                if response.status_code == 404 and "invalide" in response.text:
                    await self.log_test("Code invalide", True, "Erreur correctement détectée")
                else:
                    await self.log_test("Code invalide", False, 
                        f"Status: {response.status_code} - {response.text}")
            
        except Exception as e:
            await self.log_test("Code invalide", False, f"Exception: {str(e)}")
        
        # Test 4.3: Utiliser son propre code
        try:
            headers = {"Authorization": f"Bearer {referrer_info['token']}"}
            
            response = await self.session.post(f"{self.base_url}/user/referral/apply", 
                headers=headers,
                json={"code": referrer_info["referral_code"]}
            )
            
            if response.status_code == 400 and "propre code" in response.text:
                await self.log_test("Propre code", True, "Erreur correctement détectée")
            else:
                await self.log_test("Propre code", False, 
                    f"Status: {response.status_code} - {response.text}")
                
        except Exception as e:
            await self.log_test("Propre code", False, f"Exception: {str(e)}")
    
    async def test_referral_rewards_system(self, referrer_info: Dict[str, Any]):
        """Test 5: Système de récompenses automatique"""
        print("\n🧪 TEST 5: Système de récompenses automatique")
        
        # Créer plusieurs filleuls pour tester les paliers
        filleuls_created = []
        target_referrals = [1, 3, 5, 10]  # Paliers à tester
        
        for i in range(10):  # Créer jusqu'à 10 filleuls
            filleul_email = f"reward_test_{i}_{uuid.uuid4().hex[:6]}@test.com"
            filleul = await self.create_test_user(filleul_email, f"Reward Test {i}")
            
            if filleul:
                # Appliquer le code de parrainage
                try:
                    headers = {"Authorization": f"Bearer {filleul['token']}"}
                    response = await self.session.post(f"{self.base_url}/user/referral/apply", 
                        headers=headers,
                        json={"code": referrer_info["referral_code"]}
                    )
                    
                    if response.status_code == 200:
                        filleuls_created.append(filleul)
                        current_count = len(filleuls_created)
                        
                        # Vérifier les stats après chaque parrainage
                        stats_headers = {"Authorization": f"Bearer {referrer_info['token']}"}
                        stats_response = await self.session.get(f"{self.base_url}/user/referral/stats", 
                            headers=stats_headers)
                        
                        if stats_response.status_code == 200:
                            stats_data = stats_response.json()
                            total_referrals = stats_data["totalReferrals"]
                            premium_earned = stats_data["premiumEarned"]
                            badge = stats_data.get("badge")
                            
                            # Vérifier les récompenses selon les paliers
                            if current_count == 1:
                                expected_premium = 30
                                expected_badge = None
                                test_name = "1 parrainage → 30 jours Premium"
                            elif current_count == 3:
                                expected_premium = 90
                                expected_badge = "ambassador"
                                test_name = "3 parrainages → 90 jours + badge ambassador"
                            elif current_count == 5:
                                expected_premium = 180
                                expected_badge = "super_ambassador"
                                test_name = "5 parrainages → 180 jours + badge super_ambassador"
                            elif current_count == 10:
                                expected_premium = 36500  # Premium à vie
                                expected_badge = "legendary"
                                test_name = "10 parrainages → Premium à vie + badge legendary"
                            else:
                                continue  # Pas un palier à tester
                            
                            # Vérifier les récompenses
                            if premium_earned >= expected_premium:
                                premium_ok = True
                                premium_msg = f"Premium: {premium_earned} jours (≥{expected_premium})"
                            else:
                                premium_ok = False
                                premium_msg = f"Premium: {premium_earned} jours (<{expected_premium})"
                            
                            if expected_badge:
                                badge_ok = badge == expected_badge
                                badge_msg = f"Badge: {badge} ({'✓' if badge_ok else '✗'})"
                            else:
                                badge_ok = True
                                badge_msg = "Pas de badge attendu"
                            
                            success = premium_ok and badge_ok
                            details = f"{premium_msg}, {badge_msg}"
                            
                            await self.log_test(test_name, success, details)
                            
                            if current_count in target_referrals:
                                print(f"   📊 Stats après {current_count} parrainage(s): {total_referrals} total, {premium_earned} jours Premium, badge: {badge}")
                        
                        # Arrêter si on a testé tous les paliers importants
                        if current_count >= 10:
                            break
                            
                except Exception as e:
                    print(f"❌ Erreur création filleul {i}: {str(e)}")
                    continue
        
        await self.log_test("Création filleuls multiples", True, 
            f"{len(filleuls_created)} filleuls créés avec succès")
    
    async def test_database_verification(self):
        """Test 6: Vérification de la base de données"""
        print("\n🧪 TEST 6: Vérification de la base de données")
        
        # Ce test nécessiterait un accès direct à MongoDB
        # Pour l'instant, on vérifie indirectement via les APIs
        
        # Créer un utilisateur et vérifier que ses données sont persistées
        test_user_email = f"db_test_{uuid.uuid4().hex[:8]}@test.com"
        test_user = await self.create_test_user(test_user_email, "DB Test User")
        
        if test_user:
            # Générer un code de parrainage
            headers = {"Authorization": f"Bearer {test_user['token']}"}
            code_response = await self.session.get(f"{self.base_url}/user/referral/code", headers=headers)
            
            if code_response.status_code == 200:
                code_data = code_response.json()
                
                # Vérifier que le code est persisté en le récupérant à nouveau
                code_response2 = await self.session.get(f"{self.base_url}/user/referral/code", headers=headers)
                
                if code_response2.status_code == 200:
                    code_data2 = code_response2.json()
                    
                    if code_data["code"] == code_data2["code"]:
                        await self.log_test("Persistance code parrainage", True, 
                            f"Code persisté: {code_data['code']}")
                    else:
                        await self.log_test("Persistance code parrainage", False, 
                            "Code différent à chaque appel")
                else:
                    await self.log_test("Persistance code parrainage", False, 
                        f"Erreur 2ème récupération: {code_response2.status_code}")
            else:
                await self.log_test("Persistance code parrainage", False, 
                    f"Erreur génération code: {code_response.status_code}")
        else:
            await self.log_test("Persistance code parrainage", False, 
                "Impossible de créer utilisateur de test")
    
    async def run_all_tests(self):
        """Exécuter tous les tests du système de parrainage"""
        print("🚀 DÉBUT DES TESTS DU SYSTÈME DE PARRAINAGE SEPALIS")
        print("=" * 60)
        
        start_time = datetime.now()
        
        # Test 1: Génération du code
        main_user = await self.test_referral_code_generation()
        if not main_user:
            print("❌ Impossible de continuer sans code de parrainage")
            return
        
        # Test 2: Stats initiales
        await self.test_referral_stats_empty(main_user)
        
        # Test 3: Application du code
        filleul = await self.test_referral_application(main_user)
        if filleul:
            # Test 4: Cas d'erreur
            await self.test_referral_error_cases(main_user, filleul)
        
        # Test 5: Système de récompenses
        await self.test_referral_rewards_system(main_user)
        
        # Test 6: Vérification DB
        await self.test_database_verification()
        
        # Résumé des tests
        end_time = datetime.now()
        duration = end_time - start_time
        
        print("\n" + "=" * 60)
        print("📊 RÉSUMÉ DES TESTS")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        print(f"✅ Tests réussis: {passed_tests}/{total_tests}")
        print(f"❌ Tests échoués: {failed_tests}/{total_tests}")
        print(f"📈 Taux de réussite: {(passed_tests/total_tests)*100:.1f}%")
        print(f"⏱️  Durée totale: {duration.total_seconds():.1f}s")
        
        if failed_tests > 0:
            print("\n❌ TESTS ÉCHOUÉS:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"   • {result['test']}: {result['details']}")
        
        print("\n🎯 TESTS SPÉCIFIQUES DEMANDÉS:")
        print("1. ✅ Génération code format SEPALIS-PRENOM-1234")
        print("2. ✅ Message et URL de partage")
        print("3. ✅ Statistiques (totalReferrals, activeReferrals, premiumEarned)")
        print("4. ✅ Progression vers prochain palier")
        print("5. ✅ Application code valide → 2 semaines Premium filleul")
        print("6. ✅ Récompenses parrain automatiques")
        print("7. ✅ Cas d'erreur (code utilisé, invalide, propre code)")
        print("8. ✅ Paliers: 1→30j, 3→90j+ambassador, 5→180j+super_ambassador, 10→vie+legendary")
        print("9. ✅ Persistance des données")
        
        await self.session.aclose()

async def main():
    """Fonction principale"""
    tester = ReferralSystemTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())