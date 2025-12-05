import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { zonesAPI } from '../../services/api';

interface Zone {
  id: string;
  name: string;
  type: string;
  length: number;
  width: number;
  area: number;
  soilType: string;
  soilPH: string;
  drainage: string;
  sunExposure: string;
  climateZone: string;
  windProtection: string;
  wateringSystem: string;
  humidity: string;
  notes: string;
  plantsCount: number;
  color: string;
}

export default function Zones() {
  const router = useRouter();
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [showSoilTypeHelp, setShowSoilTypeHelp] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [newZone, setNewZone] = useState({
    name: '',
    type: 'massif',
    length: '',
    width: '',
    soilType: 'loamy',
    soilPH: 'neutral',
    humidity: 'normal',
    sunExposure: 'full_sun',
    climateZone: 'temperate',
    windProtection: 'moderate',
    wateringSystem: 'manual',
    notes: '',
  });

  // Charger les zones depuis l'API
  const loadZones = async () => {
    try {
      setLoading(true);
      const response = await zonesAPI.getZones();
      setZones(response.data);
    } catch (error) {
      console.error('Erreur lors du chargement des zones:', error);
      Alert.alert('Erreur', 'Impossible de charger les zones');
    } finally {
      setLoading(false);
    }
  };

  // Charger les zones au montage du composant
  useEffect(() => {
    loadZones();
  }, []);

  // Recharger les zones quand l'écran est focus (retour depuis zone-detail par exemple)
  useFocusEffect(
    React.useCallback(() => {
      loadZones();
    }, [])
  );

  const zoneTypes = [
    { id: 'massif', label: 'Massif', icon: 'flower', color: '#FF6B9D' },
    { id: 'terrace', label: 'Terrasse', icon: 'home', color: Colors.primary },
    { id: 'garden', label: 'Jardin', icon: 'leaf', color: '#4CAF50' },
    { id: 'pond', label: 'Bassin', icon: 'water', color: '#2196F3' },
  ];

  const soilTypes = [
    { id: 'clay', label: 'Argileux', icon: 'water', description: 'Lourd, retient l\'eau' },
    { id: 'sandy', label: 'Sableux', icon: 'sunny', description: 'Léger, drainant' },
    { id: 'loamy', label: 'Limoneux', icon: 'checkmark-circle', description: 'Équilibré, idéal' },
    { id: 'humic', label: 'Humifère', icon: 'leaf', description: 'Riche en matière organique' },
  ];

  const soilPHOptions = [
    { id: 'acidic', label: 'Acide', value: '< 6.5', color: '#FF6B6B' },
    { id: 'neutral', label: 'Neutre', value: '6.5-7.5', color: Colors.success },
    { id: 'alkaline', label: 'Alcalin', value: '> 7.5', color: '#4ECDC4' },
  ];

  const humidityOptions = [
    { id: 'very_wet', label: 'Très humide', icon: 'water' },
    { id: 'wet', label: 'Humide', icon: 'rainy' },
    { id: 'normal', label: 'Normal', icon: 'checkmark-circle' },
    { id: 'dry', label: 'Sec', icon: 'sunny' },
  ];

  const sunExposureOptions = [
    { id: 'full_sun', label: 'Plein soleil', icon: 'sunny', description: '> 6h/jour', color: '#FDB813' },
    { id: 'partial_sun', label: 'Mi-ombre', icon: 'partly-sunny', description: '3-6h/jour', color: '#FFA500' },
    { id: 'shade', label: 'Ombre', icon: 'cloudy', description: '< 3h/jour', color: '#64748B' },
    { id: 'deep_shade', label: 'Ombre dense', icon: 'moon', description: 'Très peu de lumière', color: '#475569' },
  ];

  const climateOptions = [
    { id: 'mediterranean', label: 'Méditerranéen', icon: 'sunny' },
    { id: 'oceanic', label: 'Océanique', icon: 'rainy' },
    { id: 'continental', label: 'Continental', icon: 'snow' },
    { id: 'mountain', label: 'Montagne', icon: 'trending-up' },
    { id: 'temperate', label: 'Tempéré', icon: 'partly-sunny' },
  ];

  const windOptions = [
    { id: 'exposed', label: 'Exposé', icon: 'warning' },
    { id: 'moderate', label: 'Protégé', icon: 'shield-checkmark' },
    { id: 'sheltered', label: 'Abrité', icon: 'shield' },
  ];

  const wateringOptions = [
    { id: 'manual', label: 'Manuel', icon: 'hand-left' },
    { id: 'automatic', label: 'Automatique', icon: 'timer' },
    { id: 'drip', label: 'Goutte à goutte', icon: 'water' },
    { id: 'none', label: 'Aucun', icon: 'close-circle' },
  ];

  const handleAddZone = async () => {
    // Validation du nom
    if (!newZone.name || newZone.name.trim() === '') {
      Alert.alert('Nom manquant', 'Veuillez donner un nom à votre zone');
      return;
    }
    
    // Validation des dimensions
    if (!newZone.length || !newZone.width) {
      Alert.alert('Dimensions manquantes', 'Veuillez indiquer les dimensions (longueur et largeur) de votre zone');
      return;
    }

    try {
      const selectedType = zoneTypes.find(t => t.id === newZone.type);
      const area = parseFloat(newZone.length) * parseFloat(newZone.width);
      
      const zoneData = {
        name: newZone.name,
        type: newZone.type,
        length: parseFloat(newZone.length),
        width: parseFloat(newZone.width),
        area: area,
        soilType: newZone.soilType,
        soilPH: newZone.soilPH,
        humidity: newZone.humidity,
        sunExposure: newZone.sunExposure,
        climateZone: newZone.climateZone,
        windProtection: newZone.windProtection,
        wateringSystem: newZone.wateringSystem,
        notes: newZone.notes,
        color: selectedType?.color || Colors.primary,
      };

      // Sauvegarder dans l'API
      await zonesAPI.createZone(zoneData);

      // Recharger la liste des zones
      await loadZones();

      // Réinitialiser le formulaire
      setNewZone({
        name: '',
        type: 'massif',
        length: '',
        width: '',
        soilType: 'loamy',
        soilPH: 'neutral',
        humidity: 'normal',
        sunExposure: 'full_sun',
        climateZone: 'temperate',
        windProtection: 'moderate',
        wateringSystem: 'manual',
        notes: '',
      });
      setCurrentStep(1);
      setModalVisible(false);
      Alert.alert('Succès', 'Zone créée avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création de la zone:', error);
      Alert.alert('Erreur', 'Impossible de créer la zone');
    }
  };

  const renderStep1 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Informations de base</Text>
      
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nom de la zone *</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Potager principal"
          placeholderTextColor={Colors.textSecondary}
          value={newZone.name}
          onChangeText={(text) => setNewZone({ ...newZone, name: text })}
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Type de zone *</Text>
        <View style={styles.typeGrid}>
          {zoneTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                newZone.type === type.id && { borderColor: type.color, borderWidth: 2 },
              ]}
              onPress={() => setNewZone({ ...newZone, type: type.id })}
            >
              <Ionicons name={type.icon as any} size={24} color={type.color} />
              <Text style={styles.typeLabel}>{type.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Dimensions *</Text>
        <View style={styles.dimensionsRow}>
          <View style={styles.dimensionInput}>
            <Text style={styles.dimensionLabel}>Longueur (m)</Text>
            <TextInput
              style={styles.input}
              placeholder="10"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
              value={newZone.length}
              onChangeText={(text) => setNewZone({ ...newZone, length: text })}
            />
          </View>
          <Text style={styles.dimensionMultiplier}>×</Text>
          <View style={styles.dimensionInput}>
            <Text style={styles.dimensionLabel}>Largeur (m)</Text>
            <TextInput
              style={styles.input}
              placeholder="5"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="decimal-pad"
              value={newZone.width}
              onChangeText={(text) => setNewZone({ ...newZone, width: text })}
            />
          </View>
        </View>
        {newZone.length && newZone.width && (
          <Text style={styles.areaText}>
            Surface : {(parseFloat(newZone.length) * parseFloat(newZone.width)).toFixed(1)} m²
          </Text>
        )}
      </View>
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Caractéristiques du sol</Text>

      <View style={styles.inputGroup}>
        <View style={styles.labelRow}>
          <Text style={styles.label}>Type de sol</Text>
          <TouchableOpacity 
            onPress={() => setShowSoilTypeHelp(!showSoilTypeHelp)}
            style={styles.infoButtonLarge}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle" size={28} color={Colors.accent} />
          </TouchableOpacity>
        </View>
        
        {showSoilTypeHelp && (
          <View style={styles.helpBubble}>
            <Text style={styles.helpBubbleTitle}>🌱 Test du Boudin (Conseil MOF)</Text>
            <Text style={styles.helpBubbleText}>
              1. Prenez une poignée de terre humide{'\n'}
              2. Formez un boudin entre vos mains{'\n'}
              {'\n'}
              <Text style={styles.helpBold}>• Argileux :</Text> Le boudin se forme facilement et ne se casse pas{'\n'}
              <Text style={styles.helpBold}>• Limoneux :</Text> Le boudin se forme mais se casse en morceaux{'\n'}
              <Text style={styles.helpBold}>• Sableux :</Text> Impossible de former un boudin, le sol est friable
            </Text>
          </View>
        )}
        
        <View style={styles.optionsGrid}>
          {soilTypes.map((soil) => (
            <TouchableOpacity
              key={soil.id}
              style={[
                styles.optionCard,
                newZone.soilType === soil.id && styles.optionCardSelected,
              ]}
              onPress={() => setNewZone({ ...newZone, soilType: soil.id })}
            >
              <Ionicons name={soil.icon as any} size={20} color={newZone.soilType === soil.id ? Colors.accent : Colors.textSecondary} />
              <Text style={[styles.optionLabel, newZone.soilType === soil.id && styles.optionLabelSelected]}>
                {soil.label}
              </Text>
              <Text style={styles.optionDescription}>{soil.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>pH du sol</Text>
        <View style={styles.helperBox}>
          <Ionicons name="information-circle" size={16} color={Colors.accent} />
          <Text style={styles.helperText}>
            💡 Conseil MOF : Utilisez une bandelette pH disponible en jardinerie pour identifier facilement le pH de votre sol.
          </Text>
        </View>
        <View style={styles.phRow}>
          {soilPHOptions.map((ph) => (
            <TouchableOpacity
              key={ph.id}
              style={[
                styles.phCard,
                newZone.soilPH === ph.id && { borderColor: ph.color, borderWidth: 2 },
              ]}
              onPress={() => setNewZone({ ...newZone, soilPH: ph.id })}
            >
              <Text style={[styles.phLabel, newZone.soilPH === ph.id && { color: ph.color }]}>
                {ph.label}
              </Text>
              <Text style={styles.phValue}>{ph.value}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Humidité du sol</Text>
        <View style={styles.optionsRow}>
          {humidityOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                newZone.humidity === option.id && styles.optionButtonSelected,
              ]}
              onPress={() => setNewZone({ ...newZone, humidity: option.id })}
            >
              <Ionicons name={option.icon as any} size={18} color={newZone.humidity === option.id ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.optionButtonText, newZone.humidity === option.id && styles.optionButtonTextSelected]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Exposition & Climat</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Exposition solaire</Text>
        <View style={styles.optionsGrid}>
          {sunExposureOptions.map((sun) => (
            <TouchableOpacity
              key={sun.id}
              style={[
                styles.sunCard,
                newZone.sunExposure === sun.id && { borderColor: sun.color, borderWidth: 2 },
              ]}
              onPress={() => setNewZone({ ...newZone, sunExposure: sun.id })}
            >
              <Ionicons name={sun.icon as any} size={24} color={sun.color} />
              <Text style={styles.sunLabel}>{sun.label}</Text>
              <Text style={styles.sunDescription}>{sun.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Zone climatique</Text>
        <View style={styles.optionsRow}>
          {climateOptions.map((climate) => (
            <TouchableOpacity
              key={climate.id}
              style={[
                styles.optionButton,
                newZone.climateZone === climate.id && styles.optionButtonSelected,
              ]}
              onPress={() => setNewZone({ ...newZone, climateZone: climate.id })}
            >
              <Ionicons name={climate.icon as any} size={18} color={newZone.climateZone === climate.id ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.optionButtonText, newZone.climateZone === climate.id && styles.optionButtonTextSelected]}>
                {climate.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Protection au vent</Text>
        <View style={styles.optionsRow}>
          {windOptions.map((wind) => (
            <TouchableOpacity
              key={wind.id}
              style={[
                styles.optionButton,
                newZone.windProtection === wind.id && styles.optionButtonSelected,
              ]}
              onPress={() => setNewZone({ ...newZone, windProtection: wind.id })}
            >
              <Ionicons name={wind.icon as any} size={18} color={newZone.windProtection === wind.id ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.optionButtonText, newZone.windProtection === wind.id && styles.optionButtonTextSelected]}>
                {wind.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={styles.stepContent}>
      <Text style={styles.stepTitle}>Arrosage & Humidité</Text>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Système d'arrosage</Text>
        <View style={styles.optionsRow}>
          {wateringOptions.map((water) => (
            <TouchableOpacity
              key={water.id}
              style={[
                styles.optionButton,
                newZone.wateringSystem === water.id && styles.optionButtonSelected,
              ]}
              onPress={() => setNewZone({ ...newZone, wateringSystem: water.id })}
            >
              <Ionicons name={water.icon as any} size={18} color={newZone.wateringSystem === water.id ? Colors.dark : Colors.textSecondary} />
              <Text style={[styles.optionButtonText, newZone.wateringSystem === water.id && styles.optionButtonTextSelected]}>
                {water.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Notes (optionnel)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Ajoutez des notes sur cette zone..."
          placeholderTextColor={Colors.textSecondary}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          value={newZone.notes}
          onChangeText={(text) => setNewZone({ ...newZone, notes: text })}
        />
      </View>
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.accent} />
            <Text style={styles.loadingText}>Chargement des zones...</Text>
          </View>
        ) : zones.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="grid-outline" size={80} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune zone</Text>
            <Text style={styles.emptyText}>
              Créez des zones détaillées pour mieux organiser votre jardin
            </Text>
          </View>
        ) : (
          <View style={styles.zonesGrid}>
            {zones.map((zone) => (
              <TouchableOpacity 
                key={zone.id} 
                style={styles.zoneCard}
                onPress={() => {
                  router.push({
                    pathname: '/(tabs)/zone-detail',
                    params: { zone: JSON.stringify(zone) }
                  });
                }}
              >
                <View style={[styles.zoneHeader, { backgroundColor: zone.color + '20' }]}>
                  <View style={[styles.zoneIcon, { backgroundColor: zone.color }]}>
                    <Ionicons name={zoneTypes.find(t => t.id === zone.type)?.icon as any} size={32} color={Colors.white} />
                  </View>
                  <Text style={styles.zonePlantsCount}>{zone.plantsCount} plantes</Text>
                </View>
                <View style={styles.zoneContent}>
                  <Text style={styles.zoneName}>{zone.name}</Text>
                  <View style={styles.zoneDetails}>
                    <View style={styles.zoneDetailItem}>
                      <Ionicons name="resize" size={14} color={Colors.textSecondary} />
                      <Text style={styles.zoneDetailText}>{zone.area.toFixed(1)} m²</Text>
                    </View>
                    <View style={styles.zoneDetailItem}>
                      <Ionicons name={sunExposureOptions.find(s => s.id === zone.sunExposure)?.icon as any} size={14} color={Colors.textSecondary} />
                      <Text style={styles.zoneDetailText}>{sunExposureOptions.find(s => s.id === zone.sunExposure)?.label}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nouvelle zone</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setCurrentStep(1); }}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.stepsIndicator}>
              {[1, 2, 3, 4].map((step) => (
                <View key={step} style={[styles.stepDot, currentStep >= step && styles.stepDotActive]} />
              ))}
            </View>

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            <View style={styles.modalFooter}>
              {currentStep > 1 && (
                <TouchableOpacity style={styles.backButton} onPress={() => setCurrentStep(currentStep - 1)}>
                  <Ionicons name="arrow-back" size={20} color={Colors.text} />
                  <Text style={styles.backButtonText}>Retour</Text>
                </TouchableOpacity>
              )}
              {currentStep < 4 ? (
                <TouchableOpacity style={styles.nextButton} onPress={() => {
                  // Validation de l'étape 1
                  if (currentStep === 1) {
                    if (!newZone.name || newZone.name.trim() === '') {
                      Alert.alert('Nom manquant', 'Veuillez donner un nom à votre zone');
                      return;
                    }
                    if (!newZone.length || newZone.length.trim() === '' || !newZone.width || newZone.width.trim() === '') {
                      Alert.alert('Dimensions manquantes', 'Veuillez indiquer les dimensions (longueur et largeur) de votre zone');
                      return;
                    }
                  }
                  setCurrentStep(currentStep + 1);
                }}>
                  <Text style={styles.nextButtonText}>Suivant</Text>
                  <Ionicons name="arrow-forward" size={20} color={Colors.dark} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.createButton} onPress={handleAddZone}>
                  <Text style={styles.createButtonText}>Créer la zone</Text>
                </TouchableOpacity>
              )}
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
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  zonesGrid: {
    padding: 16,
    gap: 16,
  },
  zoneCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  zoneIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zonePlantsCount: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  zoneContent: {
    padding: 16,
  },
  zoneName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  zoneDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  zoneDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  zoneDetailText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
  },
  stepsIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  stepDotActive: {
    backgroundColor: Colors.accent,
    width: 24,
  },
  stepContent: {
    maxHeight: 400,
  },
  stepTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  typeCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  dimensionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dimensionInput: {
    flex: 1,
  },
  dimensionLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dimensionMultiplier: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 20,
  },
  areaText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.accent,
    marginTop: 8,
    textAlign: 'center',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionCardSelected: {
    borderColor: Colors.accent,
    borderWidth: 2,
    backgroundColor: Colors.accent + '10',
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 4,
  },
  optionLabelSelected: {
    color: Colors.accent,
  },
  optionDescription: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  phRow: {
    flexDirection: 'row',
    gap: 12,
  },
  phCard: {
    flex: 1,
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  phLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  phValue: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoButton: {
    padding: 4,
  },
  infoButtonLarge: {
    padding: 4,
    marginLeft: 8,
    backgroundColor: Colors.accent + '15',
    borderRadius: 20,
    paddingHorizontal: 8,
  },
  helpBubble: {
    backgroundColor: Colors.accent + '15',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: Colors.accent,
  },
  helpBubbleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  helpBubbleText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  helpBold: {
    fontWeight: '600',
    color: Colors.accent,
  },
  helperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '15',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  helperText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionButtonSelected: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  optionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  optionButtonTextSelected: {
    color: Colors.dark,
  },
  sunCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sunLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 6,
  },
  sunDescription: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 16,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  createButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
