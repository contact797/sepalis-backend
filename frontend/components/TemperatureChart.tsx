import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/Colors';

interface TemperatureChartProps {
  forecast: Array<{
    date: string;
    temperature_max: number;
    temperature_min: number;
  }>;
}

export default function TemperatureChart({ forecast }: TemperatureChartProps) {
  const screenWidth = Dimensions.get('window').width - 40;

  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    return days[date.getDay()];
  };

  const labels = forecast.slice(0, 7).map(day => getDayName(day.date));
  const maxTemps = forecast.slice(0, 7).map(day => Math.round(day.temperature_max));
  const minTemps = forecast.slice(0, 7).map(day => Math.round(day.temperature_min));

  const data = {
    labels,
    datasets: [
      {
        data: maxTemps,
        color: (opacity = 1) => `rgba(255, 99, 71, ${opacity})`,
        strokeWidth: 2,
      },
      {
        data: minTemps,
        color: (opacity = 1) => `rgba(100, 181, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
    legend: ['Max', 'Min'],
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Températures</Text>
      <Text style={styles.subtitle}>Prévisions 7 jours</Text>
      <LineChart
        data={data}
        width={screenWidth}
        height={220}
        chartConfig={{
          backgroundColor: Colors.card,
          backgroundGradientFrom: Colors.card,
          backgroundGradientTo: Colors.card,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
          labelColor: (opacity = 1) => Colors.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: Colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
        withShadow={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
});
