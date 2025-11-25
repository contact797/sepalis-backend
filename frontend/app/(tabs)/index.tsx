import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, plantsAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Home() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksResponse, plantsResponse] = await Promise.all([
        tasksAPI.getTasks(),
        plantsAPI.getUserPlants(),
      ]);
      setTasks(tasksResponse.data.filter((task: any) => !task.completed));
      setPlants(plantsResponse.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((task: any) => task.dueDate?.startsWith(today));
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Bonjour {user?.name} !</Text>
        <Text style={styles.subGreeting}>Bienvenue dans votre jardin</Text>
      </View>

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="leaf" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{plants.length}</Text>
          <Text style={styles.statLabel}>Plantes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.warning + '20' }]}>
            <Ionicons name="checkbox" size={24} color={Colors.warning} />
          </View>
          <Text style={styles.statNumber}>{getTodayTasks().length}</Text>
          <Text style={styles.statLabel}>Tâches du jour</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.error + '20' }]}>
            <Ionicons name="water" size={24} color={Colors.error} />
          </View>
          <Text style={styles.statNumber}>
            {tasks.filter((t: any) => t.type === 'watering').length}
          </Text>
          <Text style={styles.statLabel}>Arrosages</Text>
        </View>
      </View>

      {/* Tâches du jour */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Tâches du jour</Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.mediumGray} />
        </View>

        {getTodayTasks().length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.emptyText}>Aucune tâche pour aujourd'hui !</Text>
          </View>
        ) : (
          getTodayTasks().slice(0, 3).map((task: any) => (
            <TouchableOpacity key={task._id} style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <Ionicons name="checkbox-outline" size={24} color={Colors.primary} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.plant && (
                  <Text style={styles.taskPlant}>{task.plant.name}</Text>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Conseils saisonniers */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conseils de saison</Text>
          <Ionicons name="bulb-outline" size={20} color={Colors.mediumGray} />
        </View>

        <View style={styles.tipCard}>
          <View style={styles.tipIcon}>
            <Ionicons name="sunny" size={32} color={Colors.warning} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>Printemps - Temps de plantation</Text>
            <Text style={styles.tipText}>
              C'est le moment idéal pour semer vos graines et préparer vos jardinières.
              N'oubliez pas d'arroser régulièrement !
            </Text>
          </View>
        </View>
      </View>

      {/* Plantes nécessitant attention */}
      {plants.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Plantes à surveiller</Text>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.mediumGray} />
          </View>

          <View style={styles.plantCard}>
            <Ionicons name="leaf" size={40} color={Colors.primary} />
            <View style={styles.plantContent}>
              <Text style={styles.plantName}>{plants[0].name}</Text>
              <Text style={styles.plantWarning}>Arrosage prévu dans 2 jours</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    backgroundColor: Colors.white,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 16,
    color: Colors.mediumGray,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  emptyCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGray,
    marginTop: 12,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  taskIcon: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  taskPlant: {
    fontSize: 14,
    color: Colors.mediumGray,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipIcon: {
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.mediumGray,
    lineHeight: 20,
  },
  plantCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantContent: {
    flex: 1,
    marginLeft: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 4,
  },
  plantWarning: {
    fontSize: 14,
    color: Colors.warning,
  },
});
