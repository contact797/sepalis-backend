import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { tasksAPI, plantsAPI, zonesAPI, weatherAPI, notificationsAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeatherWidget from '../../components/WeatherWidget';
import TasksChart from '../../components/TasksChart';
import TemperatureChart from '../../components/TemperatureChart';
import StatCard from '../../components/StatCard';
import { TrialBanner } from '../../components/TrialBanner';
import { ExpiredTrialModal } from '../../components/ExpiredTrialModal';
import { SkeletonList, SkeletonLoader } from '../../components/SkeletonLoader';
import { notificationService } from '../../services/notificationService';
import { syncService } from '../../services/syncService';
import { useSubscription } from '../../contexts/SubscriptionContext';

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  const { isExpired } = useSubscription();
  const [tasks, setTasks] = useState([]);
  const [plants, setPlants] = useState([]);
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [weatherCurrent, setWeatherCurrent] = useState<any>(null);
  const [weatherForecast, setWeatherForecast] = useState<any[]>([]);
  const [location, setLocation] = useState<{lat: number; lon: number} | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [allTasks, setAllTasks] = useState<any[]>([]);

  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();

  useEffect(() => {
    loadData();
    loadLocation();
    setupNotifications();

    // Écouter les notifications reçues
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification reçue:', notification);
    });

    // Écouter les interactions avec les notifications
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Interaction notification:', response);
      const data = response.notification.request.content.data;
      
      // Naviguer selon le type de notification
      if (data.type === 'task-reminder' && data.taskId) {
        router.push('/(tabs)/tasks');
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
    };
  }, []);

  const setupNotifications = async () => {
    try {
      // Demander les permissions
      const hasPermission = await notificationService.requestPermissions();
      
      if (hasPermission) {
        // Obtenir le token push
        const pushToken = await notificationService.getExpoPushToken();
        
        if (pushToken) {
          // Enregistrer le token sur le serveur
          await notificationsAPI.registerPushToken(
            pushToken,
            Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web'
          );
          console.log('Token push enregistré avec succès');
        }
      }
    } catch (error) {
      console.error('Erreur configuration notifications:', error);
    }
  };

  const loadLocation = async () => {
    try {
      // Essayer de récupérer la localisation sauvegardée
      const savedLocation = await AsyncStorage.getItem('userLocation');
      if (savedLocation) {
        const loc = JSON.parse(savedLocation);
        setLocation(loc);
        await loadWeather(loc.lat, loc.lon);
        return;
      }

      // Sinon, demander la géolocalisation
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const userLocation = await Location.getCurrentPositionAsync({});
        const loc = {
          lat: userLocation.coords.latitude,
          lon: userLocation.coords.longitude
        };
        setLocation(loc);
        await AsyncStorage.setItem('userLocation', JSON.stringify(loc));
        await loadWeather(loc.lat, loc.lon);
      } else {
        // Utiliser une localisation par défaut (Paris)
        const defaultLoc = { lat: 48.8566, lon: 2.3522 };
        setLocation(defaultLoc);
        await loadWeather(defaultLoc.lat, defaultLoc.lon);
      }
    } catch (error) {
      console.error('Erreur géolocalisation:', error);
      // Utiliser Paris par défaut en cas d'erreur
      const defaultLoc = { lat: 48.8566, lon: 2.3522 };
      setLocation(defaultLoc);
      await loadWeather(defaultLoc.lat, defaultLoc.lon);
    }
  };

  const loadWeather = async (lat: number, lon: number) => {
    if (weatherLoading) return;
    setWeatherLoading(true);
    try {
      const [currentResponse, forecastResponse] = await Promise.all([
        weatherAPI.getCurrentWeather(lat, lon),
        weatherAPI.getForecast(lat, lon, 7),
      ]);
      setWeatherCurrent(currentResponse.data);
      setWeatherForecast(forecastResponse.data.daily || []);
    } catch (error) {
      console.error('Erreur chargement météo:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const loadData = async () => {
    try {
      // Utiliser le service de synchronisation (cache ou serveur)
      const [fetchedTasks, fetchedPlants, fetchedZones] = await Promise.all([
        syncService.getTasks(),
        syncService.getPlants(),
        syncService.getZones(),
      ]);
      
      setAllTasks(fetchedTasks);
      setTasks(fetchedTasks.filter((task: any) => !task.completed));
      setPlants(fetchedPlants);
      setZones(fetchedZones);

      // Programmer les notifications pour les tâches du jour
      await notificationService.scheduleDailyTaskReminder(fetchedTasks);
      
      // Mettre à jour le badge avec le nombre de tâches non complétées
      const pendingTasksCount = fetchedTasks.filter((task: any) => !task.completed).length;
      await notificationService.setBadgeCount(pendingTasksCount);
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
    if (location) {
      loadWeather(location.lat, location.lon);
    }
  };

  const getTodayTasks = () => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter((task: any) => task.dueDate?.startsWith(today));
  };

  const getPendingTasks = () => {
    return tasks.filter((task: any) => !task.completed);
  };

  const getSeasonTip = () => {
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) {
      return {
        title: 'Printemps - Temps de plantation',
        text: "C'est le moment idéal pour semer vos graines et préparer vos semis. N'oubliez pas d'arroser régulièrement !",
        icon: 'flower',
        color: Colors.primary,
      };
    } else if (month >= 5 && month <= 7) {
      return {
        title: 'Été - Arrosage et récoltes',
        text: "Arrosez tôt le matin ou tard le soir. C'est le moment des premières récoltes !",
        icon: 'sunny',
        color: Colors.warning,
      };
    } else if (month >= 8 && month <= 10) {
      return {
        title: 'Automne - Préparation',
        text: 'Préparez votre jardin pour l\'hiver. Paillez et protégez vos plantes fragiles.',
        icon: 'leaf',
        color: '#FF8C00',
      };
    } else {
      return {
        title: 'Hiver - Repos végétatif',
        text: 'Planifiez la saison prochaine et entretenez vos outils. Protégez les plantes sensibles au gel.',
        icon: 'snow',
        color: '#4A90E2',
      };
    }
  };

  const seasonTip = getSeasonTip();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = user?.name || 'Jardinier';
    
    if (hour < 6) {
      return {
        main: `Bonne nuit ${name} 🌙`,
        sub: 'Votre jardin dort paisiblement'
      };
    } else if (hour < 12) {
      return {
        main: `Bon matin ${name} ! ☀️`,
        sub: 'Parfait pour commencer la journée au jardin'
      };
    } else if (hour < 18) {
      return {
        main: `Bon après-midi ${name} ! 🌻`,
        sub: 'Profitez de cette belle journée'
      };
    } else {
      return {
        main: `Bonsoir ${name} ! 🌙`,
        sub: 'Une soirée parfaite pour admirer votre jardin'
      };
    }
  };

  const greeting = getGreeting();

  // Préparer les données du graphique des tâches (7 derniers jours)
  const getTasksChartData = () => {
    const last7Days = [];
    const counts = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      // Compter les tâches complétées ce jour-là
      const completedOnDay = allTasks.filter((task: any) => 
        task.completed && task.completedAt && task.completedAt.startsWith(dateStr)
      ).length;
      
      last7Days.push(date.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(0, 3));
      counts.push(completedOnDay);
    }
    
    return {
      labels: last7Days,
      datasets: [{ data: counts.length > 0 ? counts : [0, 0, 0, 0, 0, 0, 0] }],
    };
  };

  // Calculer le taux de complétion
  const getCompletionRate = () => {
    if (allTasks.length === 0) return 0;
    const completed = allTasks.filter((task: any) => task.completed).length;
    return Math.round((completed / allTasks.length) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{greeting.main}</Text>
          <Text style={styles.subGreeting}>{greeting.sub}</Text>
        </View>
        <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/scan-plant')}>
          <Ionicons name="scan" size={24} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Trial Banner */}
      <TrialBanner />

      {/* Expired Trial Modal */}
      <ExpiredTrialModal visible={isExpired} />

      {/* Weather Widget */}
      {weatherCurrent && weatherForecast.length > 0 && (
        <WeatherWidget current={weatherCurrent} forecast={weatherForecast} />
      )}

      {/* Stat Cards */}
      <View style={styles.statCardsContainer}>
        <StatCard
          title="Taux de complétion"
          value={`${getCompletionRate()}%`}
          icon="checkmark-circle"
          color={Colors.success}
          subtitle={`${allTasks.filter((t: any) => t.completed).length}/${allTasks.length} tâches`}
        />
        <StatCard
          title="Tâches en cours"
          value={tasks.length}
          icon="list"
          color={Colors.accent}
          subtitle="À compléter"
          onPress={() => router.push('/(tabs)/tasks')}
        />
      </View>

      {/* Graphique des tâches */}
      {allTasks.length > 0 && (
        <TasksChart data={getTasksChartData()} />
      )}

      {/* Graphique des températures */}
      {weatherForecast.length > 0 && (
        <TemperatureChart forecast={weatherForecast} />
      )}

      {/* Statistiques */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + '30' }]}>
            <Ionicons name="grid" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{zones.length}</Text>
          <Text style={styles.statLabel}>Zones</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.primary + '30' }]}>
            <Ionicons name="leaf" size={24} color={Colors.primary} />
          </View>
          <Text style={styles.statNumber}>{plants.length}</Text>
          <Text style={styles.statLabel}>Plantes</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: Colors.accent + '30' }]}>
            <Ionicons name="checkbox" size={24} color={Colors.accent} />
          </View>
          <Text style={styles.statNumber}>{getPendingTasks().length}</Text>
          <Text style={styles.statLabel}>Tâches</Text>
        </View>
      </View>

      {/* Mes Zones */}
      {zones.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mes Zones</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/zones')}>
              <Text style={styles.seeAllText}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.zonesScroll}>
            {zones.slice(0, 5).map((zone: any) => (
              <TouchableOpacity
                key={zone.id}
                style={styles.zoneCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/zone-detail',
                  params: { zone: JSON.stringify(zone) }
                })}
              >
                <View style={[styles.zoneCardHeader, { backgroundColor: zone.color + '30' }]}>
                  <Ionicons name="location" size={32} color={zone.color} />
                </View>
                <View style={styles.zoneCardContent}>
                  <Text style={styles.zoneCardName} numberOfLines={1}>{zone.name}</Text>
                  <Text style={styles.zoneCardInfo}>{zone.area.toFixed(0)} m²</Text>
                  <Text style={styles.zoneCardPlants}>{zone.plantsCount || 0} plantes</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tâches du jour */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Mes Tâches</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')}>
            <Text style={styles.seeAllText}>Tout voir</Text>
          </TouchableOpacity>
        </View>

        {getTodayTasks().length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
            <Text style={styles.emptyText}>Aucune tâche pour aujourd'hui !</Text>
            <Text style={styles.emptySubtext}>Profitez de votre jardin 🌱</Text>
          </View>
        ) : (
          getTodayTasks().slice(0, 3).map((task: any) => (
            <TouchableOpacity key={task.id} style={styles.taskCard}>
              <View style={styles.taskIcon}>
                <Ionicons name="checkbox-outline" size={24} color={Colors.accent} />
              </View>
              <View style={styles.taskContent}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.description && (
                  <Text style={styles.taskDescription} numberOfLines={1}>{task.description}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Conseil de saison */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Conseil de saison</Text>
          <Ionicons name="bulb-outline" size={20} color={Colors.textSecondary} />
        </View>

        <View style={styles.tipCard}>
          <View style={[styles.tipIcon, { backgroundColor: seasonTip.color + '30' }]}>
            <Ionicons name={seasonTip.icon as any} size={32} color={seasonTip.color} />
          </View>
          <View style={styles.tipContent}>
            <Text style={styles.tipTitle}>{seasonTip.title}</Text>
            <Text style={styles.tipText}>{seasonTip.text}</Text>
          </View>
        </View>
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/scan-plant')}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '30' }]}>
              <Ionicons name="scan" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Scanner</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/add-plant')}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary + '30' }]}>
              <Ionicons name="add-circle" size={24} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionText}>Plante</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/add-task')}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '30' }]}>
              <Ionicons name="checkbox" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionText}>Tâche</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/zones')}>
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent + '30' }]}>
              <Ionicons name="grid" size={24} color={Colors.accent} />
            </View>
            <Text style={styles.quickActionText}>Zone</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  subGreeting: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scanButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statCardsContainer: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
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
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
  },
  zonesScroll: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  zoneCard: {
    width: 140,
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneCardHeader: {
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoneCardContent: {
    padding: 12,
  },
  zoneCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  zoneCardInfo: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  zoneCardPlants: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
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
    color: Colors.text,
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '600',
  },
});
