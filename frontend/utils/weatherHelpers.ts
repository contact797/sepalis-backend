// Open-Meteo Weather Code Interpretation
// https://open-meteo.com/en/docs

export interface WeatherInfo {
  description: string;
  icon: string;
  gardenAdvice: string;
}

export function getWeatherInfo(code: number): WeatherInfo {
  const weatherCodes: { [key: number]: WeatherInfo } = {
    0: {
      description: 'Ciel dégagé',
      icon: 'sunny',
      gardenAdvice: 'Journée idéale pour le jardinage ! Pensez à arroser.'
    },
    1: {
      description: 'Principalement dégagé',
      icon: 'partly-sunny',
      gardenAdvice: 'Bonnes conditions pour jardiner. Arrosage recommandé.'
    },
    2: {
      description: 'Partiellement nuageux',
      icon: 'partly-sunny',
      gardenAdvice: 'Conditions correctes pour travailler au jardin.'
    },
    3: {
      description: 'Couvert',
      icon: 'cloudy',
      gardenAdvice: 'Journée douce, idéale pour planter sans stress thermique.'
    },
    45: {
      description: 'Brouillard',
      icon: 'cloudy',
      gardenAdvice: 'Humidité élevée, évitez les traitements phytosanitaires.'
    },
    48: {
      description: 'Brouillard givrant',
      icon: 'cloudy',
      gardenAdvice: 'Risque de gel ! Protégez les plantes sensibles.'
    },
    51: {
      description: 'Bruine légère',
      icon: 'rainy',
      gardenAdvice: 'Pas besoin d\'arroser aujourd\'hui.'
    },
    53: {
      description: 'Bruine modérée',
      icon: 'rainy',
      gardenAdvice: 'Sol humide, reportez l\'arrosage.'
    },
    55: {
      description: 'Bruine dense',
      icon: 'rainy',
      gardenAdvice: 'Bon moment pour rester à l\'intérieur.'
    },
    61: {
      description: 'Pluie légère',
      icon: 'rainy',
      gardenAdvice: 'Arrosage naturel ! Profitez-en pour planifier.'
    },
    63: {
      description: 'Pluie modérée',
      icon: 'rainy',
      gardenAdvice: 'Le jardin se régale, pas d\'arrosage nécessaire.'
    },
    65: {
      description: 'Pluie forte',
      icon: 'rainy',
      gardenAdvice: 'Vérifiez le drainage de vos plantes en pot.'
    },
    71: {
      description: 'Neige légère',
      icon: 'snow',
      gardenAdvice: 'Protégez vos cultures sensibles au froid.'
    },
    73: {
      description: 'Neige modérée',
      icon: 'snow',
      gardenAdvice: 'Période de repos pour le jardin.'
    },
    75: {
      description: 'Neige forte',
      icon: 'snow',
      gardenAdvice: 'Protégez arbustes et vivaces du poids de la neige.'
    },
    77: {
      description: 'Grains de neige',
      icon: 'snow',
      gardenAdvice: 'Températures basses, surveillez vos plantes.'
    },
    80: {
      description: 'Averses légères',
      icon: 'rainy',
      gardenAdvice: 'Arrosage irrégulier, surveillez vos plantes en pot.'
    },
    81: {
      description: 'Averses modérées',
      icon: 'rainy',
      gardenAdvice: 'Sol bien humidifié, pas d\'arrosage requis.'
    },
    82: {
      description: 'Averses violentes',
      icon: 'thunderstorm',
      gardenAdvice: 'Vérifiez que l\'eau ne stagne pas.'
    },
    85: {
      description: 'Averses de neige légères',
      icon: 'snow',
      gardenAdvice: 'Températures froides, protégez les plantes.'
    },
    86: {
      description: 'Averses de neige fortes',
      icon: 'snow',
      gardenAdvice: 'Couvrez les plantations sensibles.'
    },
    95: {
      description: 'Orage',
      icon: 'thunderstorm',
      gardenAdvice: 'Restez à l\'abri, arrosage bien assuré !'
    },
    96: {
      description: 'Orage avec grêle légère',
      icon: 'thunderstorm',
      gardenAdvice: 'Protégez vos jeunes plants et semis.'
    },
    99: {
      description: 'Orage avec grêle forte',
      icon: 'thunderstorm',
      gardenAdvice: 'Couvrez impérativement vos cultures !'
    }
  };

  return weatherCodes[code] || {
    description: 'Conditions variables',
    icon: 'partly-sunny',
    gardenAdvice: 'Surveillez la météo locale.'
  };
}

export function getWeatherAlert(temperature: number, precipitation: number, humidity: number): string | null {
  if (temperature < 0) {
    return '❄️ Alerte gel : Protégez vos plantes sensibles !';
  }
  if (temperature > 30) {
    return '🌡️ Canicule prévue : Arrosage renforcé recommandé.';
  }
  if (precipitation > 20) {
    return '🌧️ Fortes pluies : Vérifiez le drainage de vos pots.';
  }
  if (humidity < 30) {
    return '💧 Air sec : Surveillez l\'hydratation de vos plantes.';
  }
  return null;
}

export function shouldWaterToday(precipitation: number, temperature: number): boolean {
  // Ne pas arroser si plus de 5mm de pluie prévue
  if (precipitation > 5) return false;
  
  // Arroser si temps chaud et sec
  if (temperature > 25 && precipitation < 1) return true;
  
  // Arroser modérément sinon
  return precipitation < 2;
}
