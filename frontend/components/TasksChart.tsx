import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Colors } from '../constants/Colors';

interface TasksChartProps {
  data: {
    labels: string[];
    datasets: [{
      data: number[];
    }];
  };
}

export default function TasksChart({ data }: TasksChartProps) {
  const screenWidth = Dimensions.get('window').width - 40;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tâches Complétées</Text>
      <Text style={styles.subtitle}>7 derniers jours</Text>
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
            r: '6',
            strokeWidth: '2',
            stroke: Colors.primary,
          },
          propsForBackgroundLines: {
            strokeDasharray: '',
            stroke: Colors.border,
            strokeWidth: 1,
          },
        }}
        bezier
        style={styles.chart}
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
