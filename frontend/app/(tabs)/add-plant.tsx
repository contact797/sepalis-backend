import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { plantsAPI, zonesAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function AddPlant() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [zones, setZones] = useState([]);
  const [loadingZones, setLoadingZones] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    scientificName: '',
    wateringFrequency: '7',
    description: '',
    zoneId: '',
  });

  useEffect(() => {
    loadZones();
  }, []);

  const loadZones = async () => {
    try {
      const response = await zonesAPI.getZones();
      setZones(response.data);
    } catch (error) {
      console.error('Erreur chargement zones:', error);
    } finally {
      setLoadingZones(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      Alert.alert('Erreur', 'Veuillez entrer le nom de la plante');
      return;
    }

    setLoading(true);
    try {
      await plantsAPI.addPlant({
        name: formData.name,
        scientificName: formData.scientificName || undefined,
        wateringFrequency: parseInt(formData.wateringFrequency) || 7,
        description: formData.description || undefined,
        zoneId: formData.zoneId || undefined,
      });
      
      Alert.alert('Succès', 'Plante ajoutée avec succès !');
      router.back();
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'ajouter la plante');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.dark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ajouter une plante</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom de la plante *</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="leaf-outline" size={20} color={Colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Tomate, Basilic..."
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nom scientifique (optionnel)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="flask-outline" size={20} color={Colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Ex: Solanum lycopersicum"
                value={formData.scientificName}
                onChangeText={(text) => setFormData({ ...formData, scientificName: text })}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Zone (optionnel)</Text>
            {loadingZones ? (
              <ActivityIndicator color={Colors.primary} />
            ) : zones.length > 0 ? (
              <View style={styles.zonesContainer}>
                <TouchableOpacity
                  style={[styles.zoneOption, !formData.zoneId && styles.zoneOptionSelected]}
                  onPress={() => setFormData({ ...formData, zoneId: '' })}
                >
                  <Text style={[styles.zoneOptionText, !formData.zoneId && styles.zoneOptionTextSelected]}>
                    Aucune zone
                  </Text>
                </TouchableOpacity>
                {zones.map((zone: any) => (
                  <TouchableOpacity
                    key={zone.id}
                    style={[styles.zoneOption, formData.zoneId === zone.id && styles.zoneOptionSelected]}
                    onPress={() => setFormData({ ...formData, zoneId: zone.id })}
                  >
                    <Ionicons name="location" size={16} color={formData.zoneId === zone.id ? Colors.white : Colors.primary} />
                    <Text style={[styles.zoneOptionText, formData.zoneId === zone.id && styles.zoneOptionTextSelected]}>
                      {zone.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={styles.hint}>Créez d'abord une zone dans l'onglet Zones</Text>
            )}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fréquence d'arrosage (jours)</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="water-outline" size={20} color={Colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="7"
                keyboardType="number-pad"
                value={formData.wateringFrequency}
                onChangeText={(text) => setFormData({ ...formData, wateringFrequency: text })}
              />
            </View>
            <Text style={styles.hint}>Nombre de jours entre chaque arrosage</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description (optionnel)</Text>
            <View style={[styles.inputContainer, styles.textAreaContainer]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Notes, conseils d'entretien..."
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
              />
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark" size={20} color={Colors.white} />
              <Text style={styles.buttonText}>Ajouter la plante</Text>
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
    backgroundColor: Colors.white,
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
    color: Colors.dark,
  },
  content: {
    flex: 1,
  },
  form: {
    padding: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.dark,
  },
  textAreaContainer: {
    alignItems: 'flex-start',
    minHeight: 100,
  },
  textArea: {
    minHeight: 80,
  },
  hint: {
    fontSize: 12,
    color: Colors.mediumGray,
    marginTop: 4,
  },
  zonesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  zoneOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  zoneOptionSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  zoneOptionText: {
    fontSize: 14,
    color: Colors.dark,
    fontWeight: '500',
  },
  zoneOptionTextSelected: {
    color: Colors.white,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  button: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
