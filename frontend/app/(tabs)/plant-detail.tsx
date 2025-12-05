import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { plantsAPI, zonesAPI } from '../../services/api';

export default function PlantDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const plant = params.plant ? JSON.parse(params.plant as string) : null;

  const [zones, setZones] = useState([]);
  const [deleting, setDeleting] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedZoneId, setSelectedZoneId] = useState(plant?.zoneId || '');
  const [showCareModal, setShowCareModal] = useState(false);
  const [careNote, setCareNote] = useState('');
  const [careHistory, setCareHistory] = useState([]);

  useEffect(() => {
    loadZones();
    loadCareHistory();
  }, []);

  const loadZones = async () => {
    try {
      const response = await zonesAPI.getZones();
      setZones(response.data);
    } catch (error) {
      console.error('Erreur chargement zones:', error);
    }
  };

  const loadCareHistory = async () => {
    // TODO: Implémenter l'historique des soins depuis l'API
    setCareHistory([]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la plante',
      `Êtes-vous sûr de vouloir supprimer "${plant.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await plantsAPI.deletePlant(plant.id);
              Alert.alert('Succès', 'Plante supprimée avec succès');
              router.back();
            } catch (error) {
              console.error('Erreur suppression plante:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la plante');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const handleMove = async () => {
    try {
      // TODO: Implémenter l'API pour déplacer une plante
      Alert.alert('Succès', 'Plante déplacée avec succès');
      setShowMoveModal(false);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de déplacer la plante');
    }
  };

  const handleAddCare = async () => {
    if (!careNote.trim()) return;
    
    // TODO: Sauvegarder dans l'API
    const newCare = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      note: careNote,
      type: 'general',
    };
    
    setCareHistory([newCare, ...careHistory]);
    setCareNote('');
    setShowCareModal(false);
    Alert.alert('Succès', 'Soin enregistré !');
  };

  if (!plant) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Plante non trouvée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la plante</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.actionButton} disabled={deleting}>
            {deleting ? (
              <ActivityIndicator color={Colors.error} size="small" />
            ) : (
              <Ionicons name="trash-outline" size={24} color={Colors.error} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* En-tête plante */}
        <View style={styles.plantHeader}>
          <View style={styles.plantIconContainer}>
            <Ionicons name="leaf" size={64} color={Colors.primary} />
          </View>
          <Text style={styles.plantName}>{plant.name}</Text>
          {plant.scientificName && (
            <Text style={styles.plantScientific}>{plant.scientificName}</Text>
          )}
        </View>

        {/* Informations */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color={Colors.accent} /> Informations
          </Text>
          
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Ionicons name="water" size={20} color={Colors.primary} />
              <Text style={styles.rowLabel}>Arrosage</Text>
              <Text style={styles.rowValue}>Tous les {plant.wateringFrequency || 7} jours</Text>
            </View>

            {plant.zoneName && (
              <TouchableOpacity style={styles.infoRow} onPress={() => setShowMoveModal(true)}>
                <Ionicons name="location" size={20} color={Colors.accent} />
                <Text style={styles.rowLabel}>Zone</Text>
                <Text style={styles.rowValue}>{plant.zoneName}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}

            <View style={styles.infoRow}>
              <Ionicons name="calendar" size={20} color={Colors.textSecondary} />
              <Text style={styles.rowLabel}>Ajoutée le</Text>
              <Text style={styles.rowValue}>
                {new Date(plant.createdAt).toLocaleDateString('fr-FR')}
              </Text>
            </View>
          </View>

          {plant.description && (
            <View style={styles.descriptionCard}>
              <Text style={styles.descriptionText}>{plant.description}</Text>
            </View>
          )}
        </View>

        {/* Actions rapides */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.quickActionButton} onPress={handleWater}>
              <Ionicons name="water" size={28} color={Colors.primary} />
              <Text style={styles.quickActionText}>Arroser</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={() => setShowCareModal(true)}>
              <Ionicons name="add-circle" size={28} color={Colors.accent} />
              <Text style={styles.quickActionText}>Soin</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickActionButton} onPress={() => router.push('/(tabs)/scan-plant')}>
              <Ionicons name="camera" size={28} color={Colors.primary} />
              <Text style={styles.quickActionText}>Scanner</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Historique des soins */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="time" size={20} color={Colors.accent} /> Historique
          </Text>
          {careHistory.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Ionicons name="document-text-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyText}>Aucun soin enregistré</Text>
              <Text style={styles.emptySubtext}>Ajoutez vos premiers soins</Text>
            </View>
          ) : (
            careHistory.map((care: any) => (
              <View key={care.id} style={styles.careCard}>
                <View style={styles.careHeader}>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
                  <Text style={styles.careDate}>
                    {new Date(care.date).toLocaleDateString('fr-FR')}
                  </Text>
                </View>
                <Text style={styles.careNote}>{care.note}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal déplacer plante */}
      <Modal visible={showMoveModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Déplacer la plante</Text>
            
            <ScrollView style={styles.zonesListModal}>
              <TouchableOpacity
                style={[styles.zoneOptionModal, !selectedZoneId && styles.zoneOptionSelected]}
                onPress={() => setSelectedZoneId('')}
              >
                <Text style={[styles.zoneOptionText, !selectedZoneId && styles.zoneOptionTextSelected]}>
                  Aucune zone
                </Text>
              </TouchableOpacity>
              
              {zones.map((zone: any) => (
                <TouchableOpacity
                  key={zone.id}
                  style={[styles.zoneOptionModal, selectedZoneId === zone.id && styles.zoneOptionSelected]}
                  onPress={() => setSelectedZoneId(zone.id)}
                >
                  <Ionicons 
                    name="location" 
                    size={16} 
                    color={selectedZoneId === zone.id ? Colors.white : Colors.primary} 
                  />
                  <Text style={[styles.zoneOptionText, selectedZoneId === zone.id && styles.zoneOptionTextSelected]}>
                    {zone.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setShowMoveModal(false)}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleMove}
              >
                <Text style={styles.confirmButtonText}>Déplacer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal ajouter soin */}
      <Modal visible={showCareModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Ajouter un soin</Text>
            
            <TextInput
              style={styles.careInput}
              placeholder="Décrivez le soin effectué..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              value={careNote}
              onChangeText={setCareNote}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => {
                  setShowCareModal(false);
                  setCareNote('');
                }}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]} 
                onPress={handleAddCare}
              >
                <Text style={styles.confirmButtonText}>Enregistrer</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    padding: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 50,
  },
  scrollView: {
    flex: 1,
  },
  plantHeader: {
    padding: 32,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  plantIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  plantName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
  },
  plantScientific: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  descriptionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  emptyHistory: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.text,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  careCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  careHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  careDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  careNote: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 20,
  },
  zonesListModal: {
    maxHeight: 300,
    marginBottom: 20,
  },
  zoneOptionModal: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneOptionText: {
    fontSize: 16,
    color: Colors.text,
  },
  zoneOptionTextSelected: {
    color: Colors.white,
    fontWeight: '600',
  },
  careInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
