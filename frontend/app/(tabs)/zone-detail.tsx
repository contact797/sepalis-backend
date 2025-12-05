import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { zonesAPI } from '../../services/api';

export default function ZoneDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const zone = params.zone ? JSON.parse(params.zone as string) : null;

  const [plants, setPlants] = useState([]);
  const [loadingPlants, setLoadingPlants] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
              await zonesAPI.deleteZone(zone.id);
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
});
