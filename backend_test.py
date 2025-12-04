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
BASE_URL = "https://garden-buddy-23.preview.emergentagent.com/api"
TEST_USER_EMAIL = f"test-sepalis-{uuid.uuid4().hex[:8]}@example.com"
TEST_USER_PASSWORD = "TestPassword123!"
TEST_USER_NAME = "Test Sepalis User"

class WeatherAPITester:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0)
        self.test_results = []
        self.passed_tests = 0
        self.total_tests = 0

    async def log_test(self, test_name: str, success: bool, details: str = ""):
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
            "test": test_name,
            "success": success,
            "details": details
        })

    async def test_current_weather_paris(self):
        """Test 1: Current weather avec coordonnées Paris"""
        try:
            response = await self.client.get(
                f"{BASE_URL}/weather/current",
                params={"lat": PARIS_LAT, "lon": PARIS_LON}
            )
            
            if response.status_code != 200:
                await self.log_test(
                    "Current Weather Paris", 
                    False, 
                    f"Status {response.status_code}: {response.text}"
                )
                return
            
            data = response.json()
            
            # Vérifier la structure de réponse
            required_fields = [
                "temperature", "apparent_temperature", "humidity", 
                "precipitation", "weather_code", "wind_speed", 
                "wind_direction", "latitude", "longitude"
            ]
            
            missing_fields = [field for field in required_fields if field not in data]
            if missing_fields:
                await self.log_test(
                    "Current Weather Paris", 
                    False, 
                    f"Champs manquants: {missing_fields}"
                )
                return
            
            # Vérifier les types de données
            type_checks = [
                (isinstance(data["temperature"], (int, float)), "temperature doit être numérique"),
                (isinstance(data["apparent_temperature"], (int, float)), "apparent_temperature doit être numérique"),
                (isinstance(data["humidity"], int), "humidity doit être entier"),
                (isinstance(data["precipitation"], (int, float)), "precipitation doit être numérique"),
                (isinstance(data["weather_code"], int), "weather_code doit être entier"),
                (isinstance(data["wind_speed"], (int, float)), "wind_speed doit être numérique"),
                (isinstance(data["wind_direction"], int), "wind_direction doit être entier"),
                (data["latitude"] == PARIS_LAT, f"latitude doit être {PARIS_LAT}"),
                (data["longitude"] == PARIS_LON, f"longitude doit être {PARIS_LON}")
            ]
            
            for check, error_msg in type_checks:
                if not check:
                    await self.log_test("Current Weather Paris", False, error_msg)
                    return
            
            # Vérifier la cohérence des valeurs
            coherence_checks = [
                (-50 <= data["temperature"] <= 60, f"Température incohérente: {data['temperature']}°C"),
                (0 <= data["humidity"] <= 100, f"Humidité incohérente: {data['humidity']}%"),
                (data["precipitation"] >= 0, f"Précipitations négatives: {data['precipitation']}"),
                (0 <= data["wind_direction"] <= 360, f"Direction vent incohérente: {data['wind_direction']}°"),
                (data["wind_speed"] >= 0, f"Vitesse vent négative: {data['wind_speed']}")
            ]
            
            for check, error_msg in coherence_checks:
                if not check:
                    await self.log_test("Current Weather Paris", False, error_msg)
                    return
            
            await self.log_test(
                "Current Weather Paris", 
                True, 
                f"Temp: {data['temperature']}°C, Humidité: {data['humidity']}%, Code: {data['weather_code']}"
            )
            
        except Exception as e:
            await self.log_test("Current Weather Paris", False, f"Exception: {str(e)}")

    async def test_forecast_paris_default(self):
        """Test 2: Forecast Paris avec 7 jours par défaut"""
        try:
            response = await self.client.get(
                f"{BASE_URL}/weather/forecast",
                params={"lat": PARIS_LAT, "lon": PARIS_LON}
            )
            
            if response.status_code != 200:
                await self.log_test(
                    "Forecast Paris Default", 
                    False, 
                    f"Status {response.status_code}: {response.text}"
                )
                return
            
            data = response.json()
            
            # Vérifier la structure
            if "daily" not in data:
                await self.log_test("Forecast Paris Default", False, "Champ 'daily' manquant")
                return
            
            if not isinstance(data["daily"], list):
                await self.log_test("Forecast Paris Default", False, "'daily' doit être une liste")
                return
            
            if len(data["daily"]) != 7:
                await self.log_test(
                    "Forecast Paris Default", 
                    False, 
                    f"Devrait retourner 7 jours, reçu: {len(data['daily'])}"
                )
                return
            
            # Vérifier chaque jour
            required_day_fields = [
                "date", "temperature_max", "temperature_min", 
                "precipitation_sum", "weather_code", "sunrise", "sunset"
            ]
            
            for i, day in enumerate(data["daily"]):
                missing_fields = [field for field in required_day_fields if field not in day]
                if missing_fields:
                    await self.log_test(
                        "Forecast Paris Default", 
                        False, 
                        f"Jour {i+1} - Champs manquants: {missing_fields}"
                    )
                    return
                
                # Vérifier les types
                type_checks = [
                    (isinstance(day["date"], str), f"Jour {i+1} - date doit être string"),
                    (isinstance(day["temperature_max"], (int, float)), f"Jour {i+1} - temperature_max doit être numérique"),
                    (isinstance(day["temperature_min"], (int, float)), f"Jour {i+1} - temperature_min doit être numérique"),
                    (isinstance(day["precipitation_sum"], (int, float)), f"Jour {i+1} - precipitation_sum doit être numérique"),
                    (isinstance(day["weather_code"], int), f"Jour {i+1} - weather_code doit être entier"),
                    (isinstance(day["sunrise"], str), f"Jour {i+1} - sunrise doit être string"),
                    (isinstance(day["sunset"], str), f"Jour {i+1} - sunset doit être string")
                ]
                
                for check, error_msg in type_checks:
                    if not check:
                        await self.log_test("Forecast Paris Default", False, error_msg)
                        return
                
                # Vérifier la cohérence
                if day["temperature_max"] < day["temperature_min"]:
                    await self.log_test(
                        "Forecast Paris Default", 
                        False, 
                        f"Jour {i+1} - Temp max < temp min: {day['temperature_max']} < {day['temperature_min']}"
                    )
                    return
            
            await self.log_test(
                "Forecast Paris Default", 
                True, 
                f"7 jours de prévisions, Jour 1: {data['daily'][0]['temperature_min']}-{data['daily'][0]['temperature_max']}°C"
            )
            
        except Exception as e:
            await self.log_test("Forecast Paris Default", False, f"Exception: {str(e)}")

    async def test_forecast_different_days(self):
        """Test 3: Forecast avec différentes valeurs de days (3, 7, 14)"""
        for days in [3, 7, 14]:
            try:
                response = await self.client.get(
                    f"{BASE_URL}/weather/forecast",
                    params={"lat": PARIS_LAT, "lon": PARIS_LON, "days": days}
                )
                
                if response.status_code != 200:
                    await self.log_test(
                        f"Forecast {days} jours", 
                        False, 
                        f"Status {response.status_code}: {response.text}"
                    )
                    continue
                
                data = response.json()
                
                if "daily" not in data or not isinstance(data["daily"], list):
                    await self.log_test(f"Forecast {days} jours", False, "Structure 'daily' invalide")
                    continue
                
                if len(data["daily"]) != days:
                    await self.log_test(
                        f"Forecast {days} jours", 
                        False, 
                        f"Attendu {days} jours, reçu {len(data['daily'])}"
                    )
                    continue
                
                await self.log_test(
                    f"Forecast {days} jours", 
                    True, 
                    f"Retourne bien {days} jours de prévisions"
                )
                
            except Exception as e:
                await self.log_test(f"Forecast {days} jours", False, f"Exception: {str(e)}")

    async def test_invalid_coordinates(self):
        """Test 4: Coordonnées invalides (doit gérer l'erreur gracieusement)"""
        invalid_coords = [
            (999, 999, "Coordonnées hors limites"),
            (-999, -999, "Coordonnées négatives extrêmes"),
            (91, 181, "Latitude/longitude hors limites")
        ]
        
        for lat, lon, description in invalid_coords:
            try:
                # Test current weather
                response = await self.client.get(
                    f"{BASE_URL}/weather/current",
                    params={"lat": lat, "lon": lon}
                )
                
                # L'API Open-Meteo peut soit retourner une erreur, soit des données par défaut
                # On vérifie que l'endpoint ne crash pas (pas de 500)
                if response.status_code == 500:
                    await self.log_test(
                        f"Current Weather - {description}", 
                        False, 
                        f"Erreur serveur 500 avec coordonnées invalides"
                    )
                else:
                    await self.log_test(
                        f"Current Weather - {description}", 
                        True, 
                        f"Gère gracieusement les coordonnées invalides (status: {response.status_code})"
                    )
                
                # Test forecast
                response = await self.client.get(
                    f"{BASE_URL}/weather/forecast",
                    params={"lat": lat, "lon": lon}
                )
                
                if response.status_code == 500:
                    await self.log_test(
                        f"Forecast - {description}", 
                        False, 
                        f"Erreur serveur 500 avec coordonnées invalides"
                    )
                else:
                    await self.log_test(
                        f"Forecast - {description}", 
                        True, 
                        f"Gère gracieusement les coordonnées invalides (status: {response.status_code})"
                    )
                
            except Exception as e:
                await self.log_test(f"Coordonnées invalides - {description}", False, f"Exception: {str(e)}")

    async def test_missing_parameters(self):
        """Test 5: Paramètres manquants (doit retourner erreur 422)"""
        test_cases = [
            ("/weather/current", {}, "Aucun paramètre"),
            ("/weather/current", {"lat": PARIS_LAT}, "Longitude manquante"),
            ("/weather/current", {"lon": PARIS_LON}, "Latitude manquante"),
            ("/weather/forecast", {}, "Aucun paramètre"),
            ("/weather/forecast", {"lat": PARIS_LAT}, "Longitude manquante"),
            ("/weather/forecast", {"lon": PARIS_LON}, "Latitude manquante")
        ]
        
        for endpoint, params, description in test_cases:
            try:
                response = await self.client.get(f"{BASE_URL}{endpoint}", params=params)
                
                if response.status_code == 422:
                    await self.log_test(
                        f"Paramètres manquants - {description}", 
                        True, 
                        "Retourne bien erreur 422"
                    )
                else:
                    await self.log_test(
                        f"Paramètres manquants - {description}", 
                        False, 
                        f"Attendu 422, reçu {response.status_code}"
                    )
                
            except Exception as e:
                await self.log_test(f"Paramètres manquants - {description}", False, f"Exception: {str(e)}")

    async def test_data_consistency(self):
        """Test 6: Vérifier la cohérence des données météo"""
        try:
            # Test avec plusieurs villes pour vérifier la cohérence
            cities = [
                (PARIS_LAT, PARIS_LON, "Paris"),
                (43.6047, 1.4442, "Toulouse"),
                (45.7640, 4.8357, "Lyon")
            ]
            
            for lat, lon, city in cities:
                response = await self.client.get(
                    f"{BASE_URL}/weather/current",
                    params={"lat": lat, "lon": lon}
                )
                
                if response.status_code != 200:
                    await self.log_test(
                        f"Cohérence données - {city}", 
                        False, 
                        f"Erreur API: {response.status_code}"
                    )
                    continue
                
                data = response.json()
                
                # Vérifications de cohérence spécifiques
                consistency_checks = [
                    (data["latitude"] == lat, f"Latitude incorrecte pour {city}"),
                    (data["longitude"] == lon, f"Longitude incorrecte pour {city}"),
                    (isinstance(data["weather_code"], int) and 0 <= data["weather_code"] <= 99, 
                     f"Code météo invalide pour {city}: {data['weather_code']}"),
                    (data["humidity"] is None or (0 <= data["humidity"] <= 100), 
                     f"Humidité invalide pour {city}: {data['humidity']}"),
                    (data["precipitation"] is None or data["precipitation"] >= 0, 
                     f"Précipitations négatives pour {city}: {data['precipitation']}")
                ]
                
                all_consistent = True
                for check, error_msg in consistency_checks:
                    if not check:
                        await self.log_test(f"Cohérence données - {city}", False, error_msg)
                        all_consistent = False
                        break
                
                if all_consistent:
                    await self.log_test(
                        f"Cohérence données - {city}", 
                        True, 
                        f"Données cohérentes (Temp: {data['temperature']}°C, Code: {data['weather_code']})"
                    )
                
        except Exception as e:
            await self.log_test("Cohérence données", False, f"Exception: {str(e)}")

    async def test_api_response_time(self):
        """Test bonus: Vérifier les temps de réponse"""
        try:
            start_time = datetime.now()
            response = await self.client.get(
                f"{BASE_URL}/weather/current",
                params={"lat": PARIS_LAT, "lon": PARIS_LON}
            )
            end_time = datetime.now()
            
            response_time = (end_time - start_time).total_seconds()
            
            if response.status_code == 200 and response_time < 10:
                await self.log_test(
                    "Temps de réponse", 
                    True, 
                    f"Réponse en {response_time:.2f}s (< 10s)"
                )
            else:
                await self.log_test(
                    "Temps de réponse", 
                    False, 
                    f"Trop lent: {response_time:.2f}s ou erreur {response.status_code}"
                )
                
        except Exception as e:
            await self.log_test("Temps de réponse", False, f"Exception: {str(e)}")

    async def run_all_tests(self):
        """Exécuter tous les tests"""
        print("🌤️  TESTS DES ENDPOINTS MÉTÉO SEPALIS")
        print("=" * 50)
        print(f"URL de base: {BASE_URL}")
        print(f"Coordonnées Paris: {PARIS_LAT}, {PARIS_LON}")
        print()
        
        # Exécuter tous les tests
        await self.test_current_weather_paris()
        await self.test_forecast_paris_default()
        await self.test_forecast_different_days()
        await self.test_invalid_coordinates()
        await self.test_missing_parameters()
        await self.test_data_consistency()
        await self.test_api_response_time()
        
        # Résumé final
        print()
        print("=" * 50)
        print(f"📊 RÉSUMÉ: {self.passed_tests}/{self.total_tests} tests réussis")
        
        if self.passed_tests == self.total_tests:
            print("🎉 TOUS LES TESTS SONT PASSÉS!")
            success_rate = 100
        else:
            success_rate = (self.passed_tests / self.total_tests) * 100
            print(f"⚠️  Taux de réussite: {success_rate:.1f}%")
            
            # Afficher les tests échoués
            failed_tests = [r for r in self.test_results if not r["success"]]
            if failed_tests:
                print("\n❌ Tests échoués:")
                for test in failed_tests:
                    print(f"  - {test['test']}: {test['details']}")
        
        await self.client.aclose()
        return success_rate

async def main():
    """Point d'entrée principal"""
    tester = WeatherAPITester()
    success_rate = await tester.run_all_tests()
    
    # Code de sortie basé sur le taux de réussite
    if success_rate == 100:
        sys.exit(0)
    elif success_rate >= 80:
        sys.exit(1)  # Quelques échecs mais majoritairement OK
    else:
        sys.exit(2)  # Échecs significatifs

if __name__ == "__main__":
    asyncio.run(main())