import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { zonesAPI } from '../../services/api';

export default function EditZone() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const existingZone = params.zone ? JSON.parse(params.zone as string) : null;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: existingZone?.name || '',
    description: existingZone?.description || '',
    dimensions: existingZone?.dimensions || '',
    soilType: existingZone?.soilType || '',
    soilPH: existingZone?.soilPH || '',
    drainage: existingZone?.drainage || '',
    sunExposure: existingZone?.sunExposure || '',
    climateZone: existingZone?.climateZone || '',
    windProtection: existingZone?.windProtection || '',
    wateringSystem: existingZone?.wateringSystem || '',
  });

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Le nom de la zone est obligatoire');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      await zonesAPI.updateZone(existingZone.id, formData);
      Alert.alert(
        'Succès',
        'La zone a été modifiée avec succès',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      console.error('Erreur modification zone:', error);
      Alert.alert(
        'Erreur',
        error.response?.data?.detail || 'Impossible de modifier la zone'
      );
    } finally {
      setLoading(false);
    }
  };

  if (!existingZone) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Zone non trouvée</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la zone</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Informations de base */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="information-circle" size={20} color={Colors.accent} /> Informations de base
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la zone *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Potager sud"
                placeholderTextColor={Colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <View style={styles.textAreaContainer}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez cette zone..."
                placeholderTextColor={Colors.textSecondary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Dimensions</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="resize-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: 5m x 3m"
                placeholderTextColor={Colors.textSecondary}
                value={formData.dimensions}
                onChangeText={(text) => setFormData({ ...formData, dimensions: text })}
              />
            </View>
          </View>
        </View>

        {/* Caractéristiques du sol */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="earth" size={20} color={Colors.accent} /> Caractéristiques du sol
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Type de sol</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="layers-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Argileux, Sableux, Limoneux"
                placeholderTextColor={Colors.textSecondary}
                value={formData.soilType}
                onChangeText={(text) => setFormData({ ...formData, soilType: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>pH du sol</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="flask-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Acide (< 6.5), Neutre (6.5-7.5), Alcalin (> 7.5)"
                placeholderTextColor={Colors.textSecondary}
                value={formData.soilPH}
                onChangeText={(text) => setFormData({ ...formData, soilPH: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Drainage</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="water-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Bon, Moyen, Mauvais"
                placeholderTextColor={Colors.textSecondary}
                value={formData.drainage}
                onChangeText={(text) => setFormData({ ...formData, drainage: text })}
              />
            </View>
          </View>
        </View>

        {/* Conditions environnementales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="sunny" size={20} color={Colors.accent} /> Conditions environnementales
          </Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Exposition au soleil</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="sunny-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Plein soleil, Mi-ombre, Ombre"
                placeholderTextColor={Colors.textSecondary}
                value={formData.sunExposure}
                onChangeText={(text) => setFormData({ ...formData, sunExposure: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zone climatique</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="thermometer-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Tempéré, Méditerranéen, Continental"
                placeholderTextColor={Colors.textSecondary}
                value={formData.climateZone}
                onChangeText={(text) => setFormData({ ...formData, climateZone: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Protection contre le vent</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="cloudy-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Protégée, Exposée, Partiellement"
                placeholderTextColor={Colors.textSecondary}
                value={formData.windProtection}
                onChangeText={(text) => setFormData({ ...formData, windProtection: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Système d'arrosage</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="git-network-outline" size={20} color={Colors.textSecondary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Goutte-à-goutte, Arrosoir, Automatique"
                placeholderTextColor={Colors.textSecondary}
                value={formData.wateringSystem}
                onChangeText={(text) => setFormData({ ...formData, wateringSystem: text })}
              />
            </View>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color={Colors.dark} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.dark} />
              <Text style={styles.saveButtonText}>Enregistrer</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  },
  placeholder: {
    width: 40,
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    paddingVertical: 14,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 0,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.accent,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
