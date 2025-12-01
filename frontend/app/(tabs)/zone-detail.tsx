import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function ZoneDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Décoder les données de la zone
  const zone = params.zone ? JSON.parse(params.zone as string) : null;

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

  const soilTypes = {
    clay: 'Argileux',
    sandy: 'Sableux',
    loamy: 'Limoneux',
    humic: 'Humifère',
  };

  const soilPHLabels = {
    acidic: 'Acide (< 6.5)',
    neutral: 'Neutre (6.5-7.5)',
    alkaline: 'Alcalin (> 7.5)',
  };

  const drainageLabels = {
    excellent: 'Excellent',
    good: 'Bon',
    moderate: 'Moyen',
    poor: 'Mauvais',
  };

  const sunExposureLabels = {
    full_sun: 'Plein soleil (> 6h/jour)',
    partial_sun: 'Mi-ombre (3-6h/jour)',
    shade: 'Ombre (< 3h/jour)',
    deep_shade: 'Ombre dense',
  };

  const climateLabels = {
    mediterranean: 'Méditerranéen',
    oceanic: 'Océanique',
    continental: 'Continental',
    mountain: 'Montagne',
    temperate: 'Tempéré',
  };

  const windLabels = {
    exposed: 'Exposé',
    moderate: 'Protégé',
    sheltered: 'Abrité',
  };

  const wateringLabels = {
    manual: 'Manuel',
    automatic: 'Automatique',
    drip: 'Goutte à goutte',
    none: 'Aucun',
  };

  const humidityLabels = {
    dry: 'Sec',
    normal: 'Normal',
    humid: 'Humide',
  };

  const zoneType = zoneTypes.find(t => t.id === zone.type);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la zone</Text>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="create-outline" size={24} color={Colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* En-tête zone */}
        <View style={[styles.zoneHeader, { backgroundColor: zoneType?.color + '20' }]}>
          <View style={[styles.zoneIcon, { backgroundColor: zoneType?.color }]}>
            <Ionicons name={zoneType?.icon as any} size={48} color={Colors.white} />
          </View>
          <Text style={styles.zoneName}>{zone.name}</Text>
          <Text style={styles.zoneType}>{zoneType?.label}</Text>
          <View style={styles.plantsBadge}>
            <Ionicons name="leaf" size={16} color={Colors.primary} />
            <Text style={styles.plantsText}>{zone.plantsCount} plantes</Text>
          </View>
        </View>

        {/* Dimensions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="resize" size={24} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Dimensions</Text>
          </View>
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Longueur</Text>
              <Text style={styles.infoValue}>{zone.length} m</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Largeur</Text>
              <Text style={styles.infoValue}>{zone.width} m</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Surface</Text>
              <Text style={styles.infoValue}>{zone.area.toFixed(1)} m²</Text>
            </View>
          </View>
        </View>

        {/* Sol */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="earth" size={24} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Caractéristiques du sol</Text>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type de sol</Text>
              <Text style={styles.detailValue}>{soilTypes[zone.soilType as keyof typeof soilTypes]}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>pH du sol</Text>
              <Text style={styles.detailValue}>{soilPHLabels[zone.soilPH as keyof typeof soilPHLabels]}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Drainage</Text>
              <Text style={styles.detailValue}>{drainageLabels[zone.drainage as keyof typeof drainageLabels]}</Text>
            </View>
          </View>
        </View>

        {/* Exposition & Climat */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="sunny" size={24} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Exposition & Climat</Text>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Exposition solaire</Text>
              <Text style={styles.detailValue}>{sunExposureLabels[zone.sunExposure as keyof typeof sunExposureLabels]}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Zone climatique</Text>
              <Text style={styles.detailValue}>{climateLabels[zone.climateZone as keyof typeof climateLabels]}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Protection au vent</Text>
              <Text style={styles.detailValue}>{windLabels[zone.windProtection as keyof typeof windLabels]}</Text>
            </View>
          </View>
        </View>

        {/* Arrosage */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="water" size={24} color={Colors.accent} />
            <Text style={styles.sectionTitle}>Arrosage & Humidité</Text>
          </View>
          <View style={styles.detailsList}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Système d'arrosage</Text>
              <Text style={styles.detailValue}>{wateringLabels[zone.wateringSystem as keyof typeof wateringLabels]}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Niveau d'humidité</Text>
              <Text style={styles.detailValue}>{humidityLabels[zone.humidity as keyof typeof humidityLabels]}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {zone.notes && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={24} color={Colors.accent} />
              <Text style={styles.sectionTitle}>Notes</Text>
            </View>
            <View style={styles.notesCard}>
              <Text style={styles.notesText}>{zone.notes}</Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="leaf" size={20} color={Colors.white} />
            <Text style={styles.actionButtonText}>Voir les plantes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]}>
            <Ionicons name="add-circle" size={20} color={Colors.text} />
            <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>
              Ajouter une plante
            </Text>
          </TouchableOpacity>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  },
  editButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  zoneHeader: {
    alignItems: 'center',
    padding: 32,
    marginBottom: 8,
  },
  zoneIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  zoneName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  zoneType: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  plantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  plantsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
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
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  detailsList: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  notesCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notesText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  actionsSection: {
    padding: 16,
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
  },
  actionButtonSecondary: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  actionButtonTextSecondary: {
    color: Colors.text,
  },
  errorText: {
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
    marginTop: 32,
  },
});
