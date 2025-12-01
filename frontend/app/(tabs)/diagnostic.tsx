import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Diagnostic() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);

  const handleTakePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      await analyzePlant(result.assets[0].base64);
    }
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      await analyzePlant(result.assets[0].base64);
    }
  };

  const analyzePlant = async (imageBase64: string) => {
    setAnalyzing(true);
    try {
      // TODO: Appeler API d'analyse IA pour diagnostic
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockDiagnosis = {
        disease: 'Mildiou',
        confidence: 0.87,
        severity: 'Modéré',
        description: 'Maladie fongique courante affectant les tomates.',
        symptoms: [
          'Taches brunes sur les feuilles',
          'Feuilles qui jaunissent',
          'Croissance ralentie',
        ],
        solutions: [
          'Retirer les feuilles infectées',
          'Appliquer un fongicide biologique',
          'Améliorer la circulation d\'air',
          'Éviter d\'arroser le feuillage',
        ],
        prevention: [
          'Espacer les plants',
          'Arroser le matin',
          'Rotation des cultures',
        ],
      };
      
      setDiagnosis(mockDiagnosis);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'analyser la photo');
    } finally {
      setAnalyzing(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'léger':
        return Colors.success;
      case 'modéré':
        return Colors.warning;
      case 'grave':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container}>
      {!photo ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="medical" size={80} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>Diagnostic Maladies</Text>
          <Text style={styles.emptyText}>
            Prenez une photo de votre plante pour identifier les problèmes
          </Text>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.primaryButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={24} color={Colors.dark} />
              <Text style={styles.primaryButtonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.secondaryButton} onPress={handlePickImage}>
              <Ionicons name="images" size={24} color={Colors.text} />
              <Text style={styles.secondaryButtonText}>Galerie</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>Conseils :</Text>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Photo en plein jour</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
              <Text style={styles.tipText}>Focus sur la zone affectée</Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={styles.resultContainer}>
          <Image source={{ uri: photo }} style={styles.photo} />

          {analyzing ? (
            <View style={styles.analyzingCard}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.analyzingText}>Analyse en cours...</Text>
            </View>
          ) : diagnosis ? (
            <View style={styles.diagnosisContainer}>
              <View style={styles.diagnosisHeader}>
                <View>
                  <Text style={styles.diseaseTitle}>{diagnosis.disease}</Text>
                  <Text style={styles.diseaseSubtitle}>Diagnostic IA</Text>
                </View>
                <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(diagnosis.severity) + '20' }]}>
                  <Text style={[styles.severityText, { color: getSeverityColor(diagnosis.severity) }]}>
                    {diagnosis.severity}
                  </Text>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.sectionText}>{diagnosis.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Symptômes</Text>
                {diagnosis.symptoms.map((symptom: string, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="alert-circle" size={18} color={Colors.warning} />
                    <Text style={styles.listText}>{symptom}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Solutions</Text>
                {diagnosis.solutions.map((solution: string, index: number) => (
                  <View key={index} style={styles.listItem}>
                    <Ionicons name="medical" size={18} color={Colors.primary} />
                    <Text style={styles.listText}>{solution}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setPhoto(null);
                  setDiagnosis(null);
                }}
              >
                <Ionicons name="refresh" size={20} color={Colors.text} />
                <Text style={styles.retryButtonText}>Nouveau diagnostic</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
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
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 32,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  resultContainer: {
    padding: 16,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
  },
  analyzingCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
  },
  diagnosisContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  diagnosisHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  diseaseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  diseaseSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  severityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  sectionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
