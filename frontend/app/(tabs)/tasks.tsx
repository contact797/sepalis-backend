import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { tasksAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Tasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.getTasks();
      setTasks(response.data);
    } catch (error) {
      console.error('Erreur chargement tâches:', error);
      Alert.alert('Erreur', 'Impossible de charger les tâches');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTasks();
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      await tasksAPI.completeTask(taskId);
      loadTasks();
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de compléter la tâche');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    Alert.alert(
      'Supprimer la tâche',
      'Êtes-vous sûr de vouloir supprimer cette tâche ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await tasksAPI.deleteTask(taskId);
              loadTasks();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la tâche');
            }
          },
        },
      ]
    );
  };

  const handleAddTask = () => {
    router.push('/(tabs)/add-task');
  };

  const getFilteredTasks = () => {
    if (filter === 'pending') {
      return tasks.filter((task: any) => !task.completed);
    } else if (filter === 'completed') {
      return tasks.filter((task: any) => task.completed);
    }
    return tasks;
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'watering':
        return 'water';
      case 'fertilizing':
        return 'leaf';
      case 'pruning':
        return 'cut';
      default:
        return 'checkbox-outline';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filtres */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'pending' && styles.filterButtonActive]}
          onPress={() => setFilter('pending')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'pending' && styles.filterTextActive,
            ]}
          >
            À faire
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'completed' && styles.filterButtonActive]}
          onPress={() => setFilter('completed')}
        >
          <Text
            style={[
              styles.filterText,
              filter === 'completed' && styles.filterTextActive,
            ]}
          >
            Terminées
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filter === 'all' && styles.filterButtonActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterText, filter === 'all' && styles.filterTextActive]}
          >
            Toutes
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {getFilteredTasks().length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={80} color={Colors.mediumGray} />
            <Text style={styles.emptyTitle}>Aucune tâche</Text>
            <Text style={styles.emptyText}>
              {filter === 'pending'
                ? 'Vous n\'avez aucune tâche en attente'
                : filter === 'completed'
                ? 'Aucune tâche terminée'
                : 'Commencez par créer votre première tâche'}
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {getFilteredTasks().map((task: any) => (
              <View key={task._id} style={styles.taskCard}>
                <TouchableOpacity
                  style={styles.taskCheckbox}
                  onPress={() => !task.completed && handleCompleteTask(task._id)}
                >
                  <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={28}
                    color={task.completed ? Colors.success : Colors.mediumGray}
                  />
                </TouchableOpacity>

                <View style={styles.taskContent}>
                  <View style={styles.taskHeader}>
                    <Ionicons
                      name={getTaskIcon(task.type)}
                      size={20}
                      color={Colors.primary}
                      style={styles.taskTypeIcon}
                    />
                    <Text
                      style={[
                        styles.taskTitle,
                        task.completed && styles.taskTitleCompleted,
                      ]}
                    >
                      {task.title}
                    </Text>
                  </View>
                  {task.description && (
                    <Text style={styles.taskDescription}>{task.description}</Text>
                  )}
                  {task.plant && (
                    <Text style={styles.taskPlant}>
                      <Ionicons name="leaf" size={14} /> {task.plant.name}
                    </Text>
                  )}
                  {task.dueDate && (
                    <Text style={styles.taskDate}>
                      <Ionicons name="calendar-outline" size={14} />{' '}
                      {new Date(task.dueDate).toLocaleDateString('fr-FR')}
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.taskDelete}
                  onPress={() => handleDeleteTask(task._id)}
                >
                  <Ionicons name="trash-outline" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddTask}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.lightGray,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mediumGray,
  },
  filterTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  tasksList: {
    padding: 16,
  },
  taskCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  taskCheckbox: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  taskTypeIcon: {
    marginRight: 8,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    flex: 1,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: Colors.mediumGray,
  },
  taskDescription: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginTop: 4,
    marginBottom: 8,
  },
  taskPlant: {
    fontSize: 14,
    color: Colors.primary,
    marginTop: 4,
  },
  taskDate: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  taskDelete: {
    padding: 4,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
