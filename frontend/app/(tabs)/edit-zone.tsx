import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { zonesAPI } from '../../services/api';

export default function EditZone() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const zone = params.zone ? JSON.parse(params.zone as string) : null;

  const [saving, setSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: zone?.name || '',
    type: zone?.type || 'vegetable',
    length: zone?.length?.toString() || '',
    width: zone?.width?.toString() || '',
    soilType: zone?.soilType || 'loamy',
    soilPH: zone?.soilPH || 'neutral',
    drainage: zone?.drainage || 'good',
    sunExposure: zone?.sunExposure || 'full_sun',
    climateZone: zone?.climateZone || 'temperate',
    windProtection: zone?.windProtection || 'moderate',
    wateringSystem: zone?.wateringSystem || 'manual',
    humidity: zone?.humidity || 'normal',
    notes: zone?.notes || '',
  });

  const zoneTypes = [
    { id: 'vegetable', label: 'Potager', icon: 'leaf', color: Colors.primary },
    { id: 'ornamental', label: 'Ornement', icon: 'flower', color: '#FF6B9D' },
    { id: 'orchard', label: 'Verger', icon: 'nutrition', color: '#FFA500' },
    { id: 'herb', label: 'Aromates', icon: 'sparkles', color: '#9C27B0' },
  ];

  const handleSave = async () => {
    if (!formData.name || !formData.length || !formData.width) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setSaving(true);
      const selectedType = zoneTypes.find(t => t.id === formData.type);
      const area = parseFloat(formData.length) * parseFloat(formData.width);

      const zoneData = {
        name: formData.name,
        type: formData.type,
        length: parseFloat(formData.length),
        width: parseFloat(formData.width),
        area: area,
        soilType: formData.soilType,
        soilPH: formData.soilPH,
        drainage: formData.drainage,
        sunExposure: formData.sunExposure,
        climateZone: formData.climateZone,
        windProtection: formData.windProtection,
        wateringSystem: formData.wateringSystem,
        humidity: formData.humidity,
        notes: formData.notes,
        color: selectedType?.color || Colors.primary,
      };

      await zonesAPI.updateZone(zone.id, zoneData);
      Alert.alert('Succès', 'Zone modifiée avec succès !', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Erreur modification zone:', error);
      Alert.alert('Erreur', 'Impossible de modifier la zone');
    } finally {
      setSaving(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Informations générales</Text>

      <Text style={styles.label}>Nom de la zone *</Text>
      <TextInput
        style={styles.input}
        value={formData.name}
        onChangeText={(text) => setFormData({ ...formData, name: text })}
        placeholder=\"Mon potager\"
        placeholderTextColor={Colors.textSecondary}
      />

      <Text style={styles.label}>Type *</Text>
      <View style={styles.typeSelector}>
        {zoneTypes.map((type) => (
          <TouchableOpacity
            key={type.id}
            style={[
              styles.typeButton,
              formData.type === type.id && { backgroundColor: type.color + '30', borderColor: type.color }
            ]}
            onPress={() => setFormData({ ...formData, type: type.id })}
          >
            <Ionicons name={type.icon as any} size={24} color={formData.type === type.id ? type.color : Colors.textSecondary} />
            <Text style={[styles.typeLabel, formData.type === type.id && { color: type.color }]}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.row}>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Longueur (m) *</Text>
          <TextInput
            style={styles.input}
            value={formData.length}
            onChangeText={(text) => setFormData({ ...formData, length: text })}
            placeholder=\"10\"
            keyboardType=\"numeric\"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
        <View style={styles.halfInput}>
          <Text style={styles.label}>Largeur (m) *</Text>
          <TextInput
            style={styles.input}
            value={formData.width}
            onChangeText={(text) => setFormData({ ...formData, width: text })}
            placeholder=\"5\"
            keyboardType=\"numeric\"
            placeholderTextColor={Colors.textSecondary}
          />
        </View>
      </View>

      {formData.length && formData.width && (
        <Text style={styles.surfaceText}>
          Surface: {(parseFloat(formData.length) * parseFloat(formData.width)).toFixed(1)} m²
        </Text>
      )}
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Sol</Text>

      <Text style={styles.label}>Type de sol</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.soilType}
          onValueChange={(value) => setFormData({ ...formData, soilType: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Argileux\" value=\"clay\" color={Colors.text} />
          <Picker.Item label=\"Sableux\" value=\"sandy\" color={Colors.text} />
          <Picker.Item label=\"Limoneux\" value=\"loamy\" color={Colors.text} />
          <Picker.Item label=\"Humifère\" value=\"humic\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>pH du sol</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.soilPH}
          onValueChange={(value) => setFormData({ ...formData, soilPH: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Acide (< 6.5)\" value=\"acidic\" color={Colors.text} />
          <Picker.Item label=\"Neutre (6.5-7.5)\" value=\"neutral\" color={Colors.text} />
          <Picker.Item label=\"Alcalin (> 7.5)\" value=\"alkaline\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>Drainage</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.drainage}
          onValueChange={(value) => setFormData({ ...formData, drainage: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Excellent\" value=\"excellent\" color={Colors.text} />
          <Picker.Item label=\"Bon\" value=\"good\" color={Colors.text} />
          <Picker.Item label=\"Moyen\" value=\"moderate\" color={Colors.text} />
          <Picker.Item label=\"Faible\" value=\"poor\" color={Colors.text} />
        </Picker>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Exposition & Climat</Text>

      <Text style={styles.label}>Exposition solaire</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.sunExposure}
          onValueChange={(value) => setFormData({ ...formData, sunExposure: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Plein soleil\" value=\"full_sun\" color={Colors.text} />
          <Picker.Item label=\"Mi-ombre\" value=\"partial_shade\" color={Colors.text} />
          <Picker.Item label=\"Ombre\" value=\"shade\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>Zone climatique</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.climateZone}
          onValueChange={(value) => setFormData({ ...formData, climateZone: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Tempéré\" value=\"temperate\" color={Colors.text} />
          <Picker.Item label=\"Méditerranéen\" value=\"mediterranean\" color={Colors.text} />
          <Picker.Item label=\"Continental\" value=\"continental\" color={Colors.text} />
          <Picker.Item label=\"Océanique\" value=\"oceanic\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>Protection au vent</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.windProtection}
          onValueChange={(value) => setFormData({ ...formData, windProtection: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Bien protégé\" value=\"high\" color={Colors.text} />
          <Picker.Item label=\"Modéré\" value=\"moderate\" color={Colors.text} />
          <Picker.Item label=\"Exposé\" value=\"low\" color={Colors.text} />
        </Picker>
      </View>
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Arrosage & Humidité</Text>

      <Text style={styles.label}>Système d'arrosage</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.wateringSystem}
          onValueChange={(value) => setFormData({ ...formData, wateringSystem: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Manuel\" value=\"manual\" color={Colors.text} />
          <Picker.Item label=\"Goutte-à-goutte\" value=\"drip\" color={Colors.text} />
          <Picker.Item label=\"Aspersion\" value=\"sprinkler\" color={Colors.text} />
          <Picker.Item label=\"Automatique\" value=\"automatic\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>Niveau d'humidité</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={formData.humidity}
          onValueChange={(value) => setFormData({ ...formData, humidity: value })}
          style={styles.picker}
          dropdownIconColor={Colors.text}
        >
          <Picker.Item label=\"Sec\" value=\"dry\" color={Colors.text} />
          <Picker.Item label=\"Normal\" value=\"normal\" color={Colors.text} />
          <Picker.Item label=\"Humide\" value=\"moist\" color={Colors.text} />
          <Picker.Item label=\"Très humide\" value=\"wet\" color={Colors.text} />
        </Picker>
      </View>

      <Text style={styles.label}>Notes</Text>
      <TextInput
        style={[styles.input, styles.textArea]}
        value={formData.notes}
        onChangeText={(text) => setFormData({ ...formData, notes: text })}
        placeholder=\"Notes personnelles...\"
        multiline
        numberOfLines={4}
        placeholderTextColor={Colors.textSecondary}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name=\"close\" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la zone</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={Colors.accent} />
          ) : (
            <Ionicons name=\"checkmark\" size={24} color={Colors.accent} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step) => (
          <View
            key={step}
            style={[
              styles.progressDot,
              currentStep >= step && styles.progressDotActive
            ]}
          />
        ))}
      </View>

      <ScrollView style={styles.scrollView}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.navigationButtons}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.navButton, styles.prevButton]}
            onPress={() => setCurrentStep(currentStep - 1)}
          >
            <Ionicons name=\"chevron-back\" size={20} color={Colors.text} />
            <Text style={styles.navButtonText}>Précédent</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 && (
          <TouchableOpacity
            style={[styles.navButton, styles.nextButton]}
            onPress={() => setCurrentStep(currentStep + 1)}
          >
            <Text style={styles.navButtonTextNext}>Suivant</Text>
            <Ionicons name=\"chevron-forward\" size={20} color={Colors.dark} />
          </TouchableOpacity>
        )}
      </View>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 8,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.backgroundLight,
  },
  progressDotActive: {
    backgroundColor: Colors.accent,
  },
  scrollView: {
    flex: 1,
  },
  stepContainer: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.text,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 8,
  },
  typeButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  surfaceText: {
    fontSize: 14,
    color: Colors.accent,
    fontWeight: '600',
    marginTop: 12,
    textAlign: 'center',
  },
  pickerContainer: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    color: Colors.text,
    backgroundColor: Colors.card,
  },
  navigationButtons: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
  },
  prevButton: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.accent,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  navButtonTextNext: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
  },
});
