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
import TaskSuggestionsModal from '../../components/TaskSuggestionsModal';
import { SwipeableItem } from '../../components/SwipeableItem';
import { haptics } from '../../utils/haptics';

export default function Tasks() {
  const router = useRouter();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);

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
      haptics.success(); // Vibration de succès
      await tasksAPI.completeTask(taskId);
      loadTasks();
    } catch (error) {
      haptics.error(); // Vibration d'erreur
      Alert.alert('Erreur', 'Impossible de compléter la tâche');
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      haptics.heavy(); // Vibration lors de la suppression
      await tasksAPI.deleteTask(taskId);
      haptics.success(); // Vibration de succès
      loadTasks();
    } catch (error) {
      haptics.error(); // Vibration d'erreur
      Alert.alert('Erreur', 'Impossible de supprimer la tâche');
    }
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
      {/* Header with Suggestions button */}
      <View style={styles.headerContainer}>
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
        <TouchableOpacity
          style={styles.suggestionsButton}
          onPress={() => setShowSuggestionsModal(true)}
        >
          <Ionicons name="bulb" size={20} color={Colors.accent} />
          <Text style={styles.suggestionsButtonText}>Suggestions</Text>
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
              <SwipeableItem
                key={task._id}
                onDelete={() => handleDeleteTask(task._id)}
              >
                <View style={styles.taskCard}>
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
                </View>
              </SwipeableItem>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={handleAddTask}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      {/* Suggestions Modal */}
      <TaskSuggestionsModal
        visible={showSuggestionsModal}
        onClose={() => setShowSuggestionsModal(false)}
        onTasksAdded={() => {
          loadTasks();
          setShowSuggestionsModal(false);
        }}
      />
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
  headerContainer: {
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: 8,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    gap: 8,
  },
  suggestionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.accent + '20',
    borderWidth: 1,
    borderColor: Colors.accent,
  },
  suggestionsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
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
