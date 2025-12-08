import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { zonesAPI } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ZoneDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const zone = params.zone ? JSON.parse(params.zone as string) : null;

  const [plants, setPlants] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [deleting, setDeleting] = useState(false);
  
  // Suggestions de plantes
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  
  // Filtres utilisateur
  const [filters, setFilters] = useState({
    height: '',
    color: '',
    bloomingSeason: '',
  });

  // Gérer les deux formats d'ID (id ou _id)
  const zoneId = zone?.id || zone?._id;

  useEffect(() => {
    if (zoneId) {
      loadPlants();
    }
  }, [zoneId]);

  useFocusEffect(
    React.useCallback(() => {
      if (zoneId) {
        loadPlants();
      }
    }, [zoneId])
  );

  const loadPlants = async () => {
    try {
      setLoadingPlants(true);
      const response = await zonesAPI.getZonePlants(zoneId);
      setPlants(response.data);
    } catch (error) {
      console.error('Erreur chargement plantes:', error);
    } finally {
      setLoadingPlants(false);
    }
  };

  const handleGetSuggestions = () => {
    // Ouvrir d'abord le modal de filtres
    setShowFiltersModal(true);
  };

  const handleApplyFilters = async () => {
    setShowFiltersModal(false);
    setShowSuggestionsModal(true);
    setLoadingSuggestions(true);
    setSuggestions([]);
    
    try {
      const token = await AsyncStorage.getItem('authToken');
      const url = `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/zones/${zoneId}/plant-suggestions`;
      
      console.log('🌿 Appel suggestions URL:', url);
      console.log('🌿 Zone ID:', zoneId);
      console.log('🎨 Filtres:', filters);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ filters }),
      });

      console.log('📡 Réponse status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Suggestions reçues:', data.suggestions?.length || 0);
        setSuggestions(data.suggestions || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur API:', response.status, errorText);
        Alert.alert(
          'Erreur',
          `Impossible de générer les suggestions (${response.status})`,
          [{ text: 'Fermer', onPress: () => setShowSuggestionsModal(false) }]
        );
      }
    } catch (error: any) {
      console.error('❌ Erreur suggestions:', error);
      Alert.alert(
        'Erreur réseau',
        error.message || 'Impossible de contacter le serveur',
        [{ text: 'Fermer', onPress: () => setShowSuggestionsModal(false) }]
      );
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddSuggestedPlant = async (plant: any) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/plants`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: plant.name,
            scientificName: plant.scientificName,
            description: `${plant.category} - ${plant.mofAdvice}`,
            zoneId: zoneId,
            isFavorite: true,  // Marquer comme favori pour distinguer des plantes scannées
          }),
        }
      );

      if (response.ok) {
        Alert.alert('✅ Favori ajouté', `${plant.name} a été ajoutée à vos favoris !`);
        loadPlants();
        setShowSuggestionsModal(false);
      } else {
        const errorText = await response.text();
        console.error('❌ Erreur ajout:', response.status, errorText);
        Alert.alert('Erreur', 'Impossible d\'ajouter la plante en favori');
      }
    } catch (error) {
      console.error('Erreur ajout plante:', error);
      Alert.alert('Erreur', 'Erreur réseau');
    }
  };

  const handleEdit = () => {
    router.push({
      pathname: '/(tabs)/edit-zone',
      params: { zone: JSON.stringify(zone) }
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Supprimer la zone',
      `Êtes-vous sûr de vouloir supprimer "${zone.name}" ?\n\nCette action est irréversible.`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(true);
              await zonesAPI.deleteZone(zoneId);
              Alert.alert('Succès', 'Zone supprimée avec succès');
              router.back();
            } catch (error) {
              console.error('Erreur suppression zone:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la zone');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  if (!zone) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Zone non trouvée</Text>
      </View>
    );
  }

  const zoneTypes = [
    { id: 'vegetable', label: 'Potager', icon: 'leaf', color: Colors.primary },
    { id: 'ornamental', label: 'Ornement', icon: 'flower', color: '#FF6B9D' },
    { id: 'orchard', label: 'Verger', icon: 'nutrition', color: '#FFA500' },
    { id: 'herb', label: 'Aromates', icon: 'sparkles', color: '#9C27B0' },
  ];

  const soilTypes: any = {
    clay: 'Argileux',
    sandy: 'Sableux',
    loamy: 'Limoneux',
    humic: 'Humifère',
  };

  const soilPHLabels: any = {
    acidic: 'Acide (< 6.5)',
    neutral: 'Neutre (6.5-7.5)',
    alkaline: 'Alcalin (> 7.5)',
  };

  const drainageLabels: any = {
    excellent: 'Excellent',
    good: 'Bon',
    moderate: 'Moyen',
    poor: 'Faible',
  };

  const sunExposureLabels: any = {
    full_sun: 'Plein soleil',
    partial_shade: 'Mi-ombre',
    shade: 'Ombre',
  };

  const climateLabels: any = {
    mediterranean: 'Méditerranéen',
    oceanic: 'Océanique',
    continental: 'Continental',
    temperate: 'Tempéré',
  };

  const windLabels: any = {
    high: 'Bien protégé',
    moderate: 'Modéré',
    low: 'Exposé',
  };

  const wateringLabels: any = {
    manual: 'Manuel',
    drip: 'Goutte-à-goutte',
    sprinkler: 'Aspersion',
    automatic: 'Automatique',
  };

  const humidityLabels: any = {
    dry: 'Sec',
    normal: 'Normal',
    moist: 'Humide',
    wet: 'Très humide',
  };

  const zoneType = zoneTypes.find(t => t.id === zone.type);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la zone</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
            <Ionicons name="create-outline" size={24} color={Colors.accent} />
          </TouchableOpacity>
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
        {/* En-tête de la zone */}
        <View style={[styles.zoneHeader, { backgroundColor: zone.color + '30' }]}>
          <Ionicons name={zoneType?.icon as any} size={64} color={zone.color} />
          <Text style={styles.zoneName}>{zone.name}</Text>
          <Text style={styles.zoneType}>{zoneType?.label}</Text>
        </View>

        {/* Dimensions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="resize" size={20} color={Colors.accent} /> Dimensions
          </Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Longueur</Text>
              <Text style={styles.infoValue}>{zone.length} m</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Largeur</Text>
              <Text style={styles.infoValue}>{zone.width} m</Text>
            </View>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Surface</Text>
              <Text style={styles.infoValue}>{zone.area.toFixed(1)} m²</Text>
            </View>
          </View>
        </View>

        {/* Sol */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="layers" size={20} color={Colors.accent} /> Sol
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Type de sol</Text>
              <Text style={styles.rowValue}>{soilTypes[zone.soilType]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>pH</Text>
              <Text style={styles.rowValue}>{soilPHLabels[zone.soilPH]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Drainage</Text>
              <Text style={styles.rowValue}>{drainageLabels[zone.drainage]}</Text>
            </View>
          </View>
        </View>

        {/* Exposition & Climat */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="sunny" size={20} color={Colors.accent} /> Exposition & Climat
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Exposition solaire</Text>
              <Text style={styles.rowValue}>{sunExposureLabels[zone.sunExposure]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Zone climatique</Text>
              <Text style={styles.rowValue}>{climateLabels[zone.climateZone]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Protection au vent</Text>
              <Text style={styles.rowValue}>{windLabels[zone.windProtection]}</Text>
            </View>
          </View>
        </View>

        {/* Arrosage & Humidité */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="water" size={20} color={Colors.accent} /> Arrosage & Humidité
          </Text>
          <View style={styles.infoList}>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Système d'arrosage</Text>
              <Text style={styles.rowValue}>{wateringLabels[zone.wateringSystem]}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>Humidité</Text>
              <Text style={styles.rowValue}>{humidityLabels[zone.humidity]}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {zone.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="document-text" size={20} color={Colors.accent} /> Notes
            </Text>
            <Text style={styles.notesText}>{zone.notes}</Text>
          </View>
        )}

        {/* Plantes de cette zone */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="leaf" size={20} color={Colors.accent} /> Plantes ({plants.length})
            </Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/add-plant')}>
              <Ionicons name="add-circle" size={28} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Bouton Suggestions MOF */}
          <TouchableOpacity
            style={styles.suggestionsButton}
            onPress={handleGetSuggestions}
          >
            <Ionicons name="bulb" size={20} color={Colors.white} />
            <Text style={styles.suggestionsButtonText}>Suggestions MOF pour cette zone</Text>
          </TouchableOpacity>

          {loadingPlants ? (
            <ActivityIndicator color={Colors.accent} style={{ marginTop: 20 }} />
          ) : plants.length === 0 ? (
            <View style={styles.emptyPlants}>
              <Ionicons name="leaf-outline" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyPlantsText}>Aucune plante dans cette zone</Text>
              <TouchableOpacity
                style={styles.addPlantButton}
                onPress={() => router.push('/(tabs)/add-plant')}
              >
                <Text style={styles.addPlantButtonText}>Ajouter une plante</Text>
              </TouchableOpacity>
            </View>
          ) : (
            plants.map((plant: any) => (
              <View key={plant.id} style={styles.plantCard}>
                <Ionicons name="leaf" size={32} color={Colors.primary} />
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  {plant.scientificName && (
                    <Text style={styles.plantScientific}>{plant.scientificName}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Modal des suggestions */}
      <Modal
        visible={showSuggestionsModal}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setShowSuggestionsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Suggestions MOF</Text>
            <TouchableOpacity
              onPress={() => setShowSuggestionsModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {loadingSuggestions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Génération des suggestions...</Text>
            </View>
          ) : (
            <ScrollView style={styles.suggestionsScroll}>
              {suggestions.map((plant, index) => (
                <View key={index} style={styles.suggestionCard}>
                  <View style={styles.suggestionHeader}>
                    <Text style={styles.suggestionName}>{plant.name}</Text>
                    <Text style={styles.suggestionScientific}>{plant.scientificName}</Text>
                  </View>
                  
                  <Text style={styles.suggestionCategory}>
                    <Ionicons name="leaf" size={16} color={Colors.accent} /> {plant.category}
                  </Text>
                  
                  <Text style={styles.suggestionAdvice}>{plant.mofAdvice}</Text>
                  
                  <TouchableOpacity
                    style={styles.addSuggestionButton}
                    onPress={() => handleAddSuggestedPlant(plant)}
                  >
                    <Ionicons name="add" size={20} color={Colors.white} />
                    <Text style={styles.addSuggestionButtonText}>Ajouter à ma zone</Text>
                  </TouchableOpacity>
                </View>
              ))}
              
              {suggestions.length === 0 && !loadingSuggestions && (
                <View style={styles.noSuggestions}>
                  <Ionicons name="leaf-outline" size={48} color={Colors.textSecondary} />
                  <Text style={styles.noSuggestionsText}>
                    Aucune suggestion disponible pour cette zone
                  </Text>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Modal des filtres */}
      <Modal
        visible={showFiltersModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>🎨 Personnalisez vos suggestions</Text>
            <TouchableOpacity
              onPress={() => setShowFiltersModal(false)}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filtersScroll}>
            <Text style={styles.filtersSubtitle}>
              Affinez les suggestions selon vos préférences
            </Text>

            {/* Hauteur */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🌳 Hauteur souhaitée</Text>
              <View style={styles.filterOptions}>
                {['Petite (< 50cm)', 'Moyenne (50cm - 1.5m)', 'Grande (> 1.5m)'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterChip,
                      filters.height === option && styles.filterChipSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, height: filters.height === option ? '' : option })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.height === option && styles.filterChipTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Couleur de floraison */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🎨 Couleur de floraison</Text>
              <View style={styles.filterOptions}>
                {[
                  { label: 'Blanc', color: '#FFFFFF' },
                  { label: 'Rose', color: '#FFB6C1' },
                  { label: 'Rouge', color: '#DC143C' },
                  { label: 'Bleu', color: '#4169E1' },
                  { label: 'Jaune', color: '#FFD700' },
                  { label: 'Orange', color: '#FF8C00' },
                  { label: 'Violet', color: '#8A2BE2' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.colorChip,
                      filters.color === option.label && styles.colorChipSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, color: filters.color === option.label ? '' : option.label })}
                  >
                    <View style={[styles.colorCircle, { backgroundColor: option.color, borderWidth: option.label === 'Blanc' ? 1 : 0, borderColor: Colors.border }]} />
                    <Text style={styles.colorLabel}>{option.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Époque de floraison */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>🌸 Époque de floraison</Text>
              <View style={styles.filterOptions}>
                {['Printemps', 'Été', 'Automne', 'Hiver'].map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.filterChip,
                      filters.bloomingSeason === option && styles.filterChipSelected,
                    ]}
                    onPress={() => setFilters({ ...filters, bloomingSeason: filters.bloomingSeason === option ? '' : option })}
                  >
                    <Text style={[
                      styles.filterChipText,
                      filters.bloomingSeason === option && styles.filterChipTextSelected,
                    ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.filterActions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={() => setFilters({ height: '', color: '', bloomingSeason: '' })}
              >
                <Text style={styles.resetButtonText}>Réinitialiser</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApplyFilters}
              >
                <Ionicons name="checkmark-circle" size={20} color={Colors.white} />
                <Text style={styles.applyButtonText}>Voir les suggestions</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  zoneHeader: {
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  zoneName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    textAlign: 'center',
  },
  zoneType: {
    fontSize: 16,
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
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoItem: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  infoList: {
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rowLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyPlants: {
    alignItems: 'center',
    padding: 32,
  },
  emptyPlantsText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 16,
  },
  addPlantButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addPlantButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  plantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 12,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  suggestionsButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  suggestionsButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  closeButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  suggestionsScroll: {
    flex: 1,
    padding: 20,
  },
  suggestionCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  suggestionHeader: {
    marginBottom: 8,
  },
  suggestionName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  suggestionScientific: {
    fontSize: 14,
    fontStyle: 'italic',
    color: Colors.textSecondary,
  },
  suggestionCategory: {
    fontSize: 14,
    color: Colors.accent,
    marginBottom: 12,
  },
  suggestionAdvice: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  addSuggestionButton: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  addSuggestionButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  noSuggestions: {
    alignItems: 'center',
    padding: 32,
  },
  noSuggestionsText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
  // Styles filtres
  filtersScroll: {
    padding: 20,
  },
  filtersSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
  },
  filterSection: {
    marginBottom: 32,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  filterChipText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  filterChipTextSelected: {
    color: Colors.white,
  },
  colorChip: {
    alignItems: 'center',
    padding: 8,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  colorChipSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '20',
  },
  colorCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  colorLabel: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  filterActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  applyButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
