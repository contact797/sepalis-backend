import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { getWeatherInfo, getWeatherAlert, shouldWaterToday } from '../utils/weatherHelpers';

interface WeatherWidgetProps {
  current: {
    temperature: number;
    humidity: number;
    precipitation: number;
    weather_code: number;
    wind_speed: number;
  };
  forecast: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
    weather_code: number;
    precipitation_sum: number;
  }>;
}

export default function WeatherWidget({ current, forecast }: WeatherWidgetProps) {
  const weatherInfo = getWeatherInfo(current.weather_code);
  const alert = getWeatherAlert(current.temperature, current.precipitation, current.humidity);
  const canWater = shouldWaterToday(current.precipitation, current.temperature);

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  return (
    <View style={styles.container}>
      {/* Current Weather */}
      <View style={styles.currentWeather}>
        <View style={styles.currentLeft}>
          <Ionicons name={weatherInfo.icon as any} size={60} color={Colors.accent} />
          <View style={styles.tempContainer}>
            <Text style={styles.temperature}>{Math.round(current.temperature)}°</Text>
            <Text style={styles.weatherDesc}>{weatherInfo.description}</Text>
          </View>
        </View>
        <View style={styles.currentRight}>
          <View style={styles.weatherDetail}>
            <Ionicons name="water" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{current.humidity}%</Text>
          </View>
          <View style={styles.weatherDetail}>
            <Ionicons name="speedometer" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{Math.round(current.wind_speed)} km/h</Text>
          </View>
        </View>
      </View>

      {/* Alert */}
      {alert && (
        <View style={styles.alertCard}>
          <Ionicons name="warning" size={20} color={Colors.warning} />
          <Text style={styles.alertText}>{alert}</Text>
        </View>
      )}

      {/* Garden Advice */}
      <View style={[styles.adviceCard, canWater ? styles.waterAdvice : styles.noWaterAdvice]}>
        <Ionicons 
          name={canWater ? "water" : "checkmark-circle"} 
          size={20} 
          color={canWater ? Colors.primary : Colors.success} 
        />
        <Text style={styles.adviceText}>
          {canWater 
            ? "💧 N'oubliez pas d'arroser vos plantes aujourd'hui"
            : "✓ Pas besoin d'arroser aujourd'hui"}
        </Text>
      </View>

      {/* Garden Tip */}
      <View style={styles.tipCard}>
        <Ionicons name="leaf" size={18} color={Colors.primary} />
        <Text style={styles.tipText}>{weatherInfo.gardenAdvice}</Text>
      </View>

      {/* 7-day Forecast */}
      <Text style={styles.forecastTitle}>Prévisions 7 jours</Text>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.forecastScroll}
      >
        {forecast.slice(0, 7).map((day, index) => {
          const dayInfo = getWeatherInfo(day.weather_code);
          return (
            <View key={index} style={styles.forecastDay}>
              <Text style={styles.forecastDayName}>
                {index === 0 ? "Auj." : getDayName(day.date)}
              </Text>
              <Ionicons name={dayInfo.icon as any} size={28} color={Colors.accent} />
              <Text style={styles.forecastTemp}>{Math.round(day.temperature_max)}°</Text>
              <Text style={styles.forecastTempMin}>{Math.round(day.temperature_min)}°</Text>
              {day.precipitation_sum > 0 && (
                <View style={styles.rainIndicator}>
                  <Ionicons name="rainy" size={12} color={Colors.primary} />
                  <Text style={styles.rainText}>{Math.round(day.precipitation_sum)}mm</Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  currentWeather: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  tempContainer: {
    gap: 4,
  },
  temperature: {
    fontSize: 48,
    fontWeight: 'bold',
    color: Colors.text,
  },
  weatherDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  currentRight: {
    gap: 8,
  },
  weatherDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.warning + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  alertText: {
    flex: 1,
    fontSize: 13,
    color: Colors.warning,
    fontWeight: '600',
  },
  adviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  waterAdvice: {
    backgroundColor: Colors.primary + '20',
  },
  noWaterAdvice: {
    backgroundColor: Colors.success + '20',
  },
  adviceText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: Colors.accent + '15',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  forecastTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  forecastScroll: {
    marginHorizontal: -8,
  },
  forecastDay: {
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 4,
    backgroundColor: Colors.background,
    borderRadius: 12,
    minWidth: 70,
  },
  forecastDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  forecastTemp: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 8,
  },
  forecastTempMin: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  rainIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  rainText: {
    fontSize: 10,
    color: Colors.primary,
  },
});
