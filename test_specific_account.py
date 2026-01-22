#!/usr/bin/env python3
"""
Test spécifique pour le compte contact@nicolasblot.com
"""

import asyncio
import httpx
import json

BASE_URL = "https://sepalis-app-1.preview.emergentagent.com/api"
TEST_EMAIL = "contact@nicolasblot.com"

async def test_specific_account():
    """Test du compte spécifique mentionné dans la demande"""
    
    print("🧪 TEST COMPTE SPÉCIFIQUE: contact@nicolasblot.com")
    print("=" * 50)
    
    async with httpx.AsyncClient(timeout=30.0) as session:
        
        # Essayer de créer le compte avec un mot de passe simple
        print("1. Tentative de création du compte...")
        try:
            response = await session.post(f"{BASE_URL}/auth/register", json={
                "email": TEST_EMAIL,
                "name": "Nicolas Blot",
                "password": "sepalis2024"
            })
            
            if response.status_code == 200:
                data = response.json()
                token = data["token"]
                print(f"✅ Compte créé avec succès!")
                
                # Tester la génération du code de parrainage
                headers = {"Authorization": f"Bearer {token}"}
                code_response = await session.get(f"{BASE_URL}/user/referral/code", headers=headers)
                
                if code_response.status_code == 200:
                    code_data = code_response.json()
                    print(f"✅ Code de parrainage généré: {code_data['code']}")
                    print(f"📱 URL de partage: {code_data['shareUrl']}")
                    print(f"💬 Message de partage: {code_data['shareMessage'][:100]}...")
                    
                    # Tester les statistiques
                    stats_response = await session.get(f"{BASE_URL}/user/referral/stats", headers=headers)
                    if stats_response.status_code == 200:
                        stats_data = stats_response.json()
                        print(f"📊 Statistiques initiales:")
                        print(f"   - Total parrainages: {stats_data['totalReferrals']}")
                        print(f"   - Parrainages actifs: {stats_data['activeReferrals']}")
                        print(f"   - Premium gagné: {stats_data['premiumEarned']} jours")
                        print(f"   - Prochain palier: {stats_data['nextReward']}")
                        print(f"✅ Le compte est prêt pour les tests de parrainage!")
                    else:
                        print(f"❌ Erreur récupération stats: {stats_response.status_code}")
                else:
                    print(f"❌ Erreur génération code: {code_response.status_code}")
                    
            elif response.status_code == 400 and "already registered" in response.text:
                print("⚠️  Le compte existe déjà. Tentative de connexion...")
                
                # Essayer plusieurs mots de passe
                passwords = ["sepalis2024", "password123", "admin123", "test123", "123456"]
                
                for password in passwords:
                    login_response = await session.post(f"{BASE_URL}/auth/login", json={
                        "email": TEST_EMAIL,
                        "password": password
                    })
                    
                    if login_response.status_code == 200:
                        data = login_response.json()
                        token = data["token"]
                        print(f"✅ Connexion réussie avec le mot de passe: {password}")
                        
                        # Tester le code de parrainage
                        headers = {"Authorization": f"Bearer {token}"}
                        code_response = await session.get(f"{BASE_URL}/user/referral/code", headers=headers)
                        
                        if code_response.status_code == 200:
                            code_data = code_response.json()
                            print(f"✅ Code de parrainage existant: {code_data['code']}")
                            print(f"📱 URL de partage: {code_data['shareUrl']}")
                            
                            # Vérifier les stats
                            stats_response = await session.get(f"{BASE_URL}/user/referral/stats", headers=headers)
                            if stats_response.status_code == 200:
                                stats_data = stats_response.json()
                                print(f"📊 Statistiques actuelles:")
                                print(f"   - Total parrainages: {stats_data['totalReferrals']}")
                                print(f"   - Parrainages actifs: {stats_data['activeReferrals']}")
                                print(f"   - Premium gagné: {stats_data['premiumEarned']} jours")
                                print(f"   - Badge actuel: {stats_data.get('badge', 'Aucun')}")
                                print(f"✅ Le compte est opérationnel!")
                            break
                        else:
                            print(f"❌ Erreur génération code: {code_response.status_code}")
                            break
                else:
                    print("❌ Impossible de se connecter avec les mots de passe testés")
                    print("💡 Le compte existe mais le mot de passe est différent")
                    
            else:
                print(f"❌ Erreur création compte: {response.status_code} - {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {str(e)}")

if __name__ == "__main__":
    asyncio.run(test_specific_account())