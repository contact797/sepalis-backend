import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { tasksAPI } from '../services/api';

interface TaskSuggestionsModalProps {
  visible: boolean;
  onClose: () => void;
  onTasksAdded: () => void;
}

export default function TaskSuggestionsModal({ visible, onClose, onTasksAdded }: TaskSuggestionsModalProps) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedSuggestions, setSelectedSuggestions] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (visible) {
      loadSuggestions();
    }
  }, [visible]);

  const loadSuggestions = async () => {
    setLoading(true);
    try {
      const response = await tasksAPI.getSuggestions();
      setSuggestions(response.data.suggestions || []);
      // Sélectionner toutes les suggestions par défaut
      setSelectedSuggestions(new Set(response.data.suggestions.map((_: any, index: number) => index)));
    } catch (error) {
      console.error('Erreur chargement suggestions:', error);
      Alert.alert('Erreur', 'Impossible de charger les suggestions');
    } finally {
      setLoading(false);
    }
  };

  const toggleSuggestion = (index: number) => {
    const newSelected = new Set(selectedSuggestions);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedSuggestions(newSelected);
  };

  const handleAddSelectedTasks = async () => {
    if (selectedSuggestions.size === 0) {
      Alert.alert('Aucune tâche sélectionnée', 'Veuillez sélectionner au moins une tâche');
      return;
    }

    setLoading(true);
    try {
      // Créer toutes les tâches sélectionnées
      const tasksToAdd = Array.from(selectedSuggestions).map(index => suggestions[index]);
      
      await Promise.all(
        tasksToAdd.map(task => tasksAPI.createTask(task))
      );

      Alert.alert('Succès', `${tasksToAdd.length} tâche(s) ajoutée(s)`);
      onTasksAdded();
      onClose();
    } catch (error) {
      console.error('Erreur ajout tâches:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter les tâches');
    } finally {
      setLoading(false);
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'watering': return 'water';
      case 'fertilizing': return 'nutrition';
      case 'pruning': return 'cut';
      default: return 'checkbox-outline';
    }
  };

  const getTaskTypeColor = (type: string) => {
    switch (type) {
      case 'watering': return Colors.primary;
      case 'fertilizing': return Colors.success;
      case 'pruning': return Colors.warning;
      default: return Colors.accent;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Demain';
    } else {
      return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Suggestions de tâches</Text>
              <Text style={styles.modalSubtitle}>
                Basées sur vos plantes et la saison
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.loadingText}>Génération des suggestions...</Text>
            </View>
          ) : (
            <>
              <ScrollView style={styles.suggestionsList} showsVerticalScrollIndicator={false}>
                {suggestions.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="checkmark-circle" size={60} color={Colors.success} />
                    <Text style={styles.emptyTitle}>Aucune suggestion</Text>
                    <Text style={styles.emptyText}>
                      Vos tâches sont à jour ! Revenez plus tard pour de nouvelles suggestions.
                    </Text>
                  </View>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.suggestionCard,
                        selectedSuggestions.has(index) && styles.suggestionCardSelected
                      ]}
                      onPress={() => toggleSuggestion(index)}
                    >
                      <View style={styles.suggestionLeft}>
                        <View style={[
                          styles.taskTypeIndicator,
                          { backgroundColor: getTaskTypeColor(suggestion.type) + '30' }
                        ]}>
                          <Ionicons
                            name={getTaskTypeIcon(suggestion.type) as any}
                            size={20}
                            color={getTaskTypeColor(suggestion.type)}
                          />
                        </View>
                        <View style={styles.suggestionContent}>
                          <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                          <Text style={styles.suggestionDescription} numberOfLines={2}>
                            {suggestion.description}
                          </Text>
                          {suggestion.dueDate && (
                            <View style={styles.dueDateContainer}>
                              <Ionicons name="calendar-outline" size={14} color={Colors.textSecondary} />
                              <Text style={styles.dueDateText}>
                                {formatDate(suggestion.dueDate)}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View style={[
                        styles.checkbox,
                        selectedSuggestions.has(index) && styles.checkboxSelected
                      ]}>
                        {selectedSuggestions.has(index) && (
                          <Ionicons name="checkmark" size={18} color={Colors.dark} />
                        )}
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>

              {suggestions.length > 0 && (
                <View style={styles.modalFooter}>
                  <TouchableOpacity
                    style={styles.selectAllButton}
                    onPress={() => {
                      if (selectedSuggestions.size === suggestions.length) {
                        setSelectedSuggestions(new Set());
                      } else {
                        setSelectedSuggestions(new Set(suggestions.map((_, i) => i)));
                      }
                    }}
                  >
                    <Text style={styles.selectAllText}>
                      {selectedSuggestions.size === suggestions.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addButton,
                      selectedSuggestions.size === 0 && styles.addButtonDisabled
                    ]}
                    onPress={handleAddSelectedTasks}
                    disabled={selectedSuggestions.size === 0}
                  >
                    <Ionicons name="add-circle" size={20} color={Colors.dark} />
                    <Text style={styles.addButtonText}>
                      Ajouter ({selectedSuggestions.size})
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  suggestionsList: {
    padding: 20,
    paddingTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  suggestionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  suggestionCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  suggestionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDateText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  selectAllButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  addButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark,
  },
});
