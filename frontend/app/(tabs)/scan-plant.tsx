import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { plantsAPI } from '../../services/api';

export default function ScanPlant() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

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
      await analyzePhoto(result.assets[0].base64);
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
      await analyzePhoto(result.assets[0].base64);
    }
  };

  const analyzePhoto = async (imageBase64: string) => {
    setAnalyzing(true);
    console.log('🔍 Début analyse photo...');
    
    try {
      // Appeler l'API Plant.id via notre backend
      const { aiAPI } = await import('../../services/api');
      console.log('📡 Appel API identification...');
      
      const response = await aiAPI.identifyPlant(imageBase64);
      console.log('✅ Réponse API:', response.data);
      
      if (response.data && response.data.name) {
        setResult({
          name: response.data.name,
          scientificName: response.data.scientificName,
          confidence: response.data.confidence,
          wateringFrequency: response.data.wateringFrequency || 7,
          description: response.data.description || 'Plante identifiée avec succès',
          family: response.data.family,
          sunlight: response.data.sunlight,
          difficulty: response.data.difficulty,
          tips: response.data.tips,
        });
      } else {
        throw new Error('Réponse API invalide');
      }
    } catch (error: any) {
      console.error('❌ Erreur analyse:', error);
      console.error('Details:', error.response?.data || error.message);
      
      const errorMessage = error.response?.data?.detail || error.message || 'Erreur inconnue';
      Alert.alert(
        'Erreur d\'identification',
        `Impossible d'identifier la plante.\n\nDétails: ${errorMessage}\n\nVérifiez votre connexion internet et réessayez.`,
        [
          { text: 'Réessayer', onPress: () => setPhoto(null) },
          { text: 'Annuler', style: 'cancel' }
        ]
      );
    } finally {
      setAnalyzing(false);
      console.log('🏁 Analyse terminée');
    }
  };

  const handleAddPlant = async () => {
    if (!result) return;

    try {
      await plantsAPI.addPlant({
        name: result.name,
        scientificName: result.scientificName,
        wateringFrequency: result.wateringFrequency,
        description: result.description,
      });

      Alert.alert('Succès', 'Plante ajoutée à votre jardin !', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter la plante');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scanner une plante</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-off" size={80} color={Colors.textSecondary} />
          <Text style={styles.permissionTitle}>Accès caméra refusé</Text>
          <Text style={styles.permissionText}>
            Veuillez autoriser l'accès à la caméra dans les paramètres
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner une plante</Text>
        <View style={{ width: 24 }} />
      </View>

      {!photo ? (
        <View style={styles.cameraContainer}>
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera" size={80} color={Colors.textSecondary} />
            <Text style={styles.cameraText}>Prenez une photo de votre plante</Text>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
              <Ionicons name="camera" size={32} color={Colors.dark} />
              <Text style={styles.actionButtonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.actionButton, styles.actionButtonSecondary]} onPress={handlePickImage}>
              <Ionicons name="images" size={32} color={Colors.text} />
              <Text style={[styles.actionButtonText, styles.actionButtonTextSecondary]}>Galerie</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <ScrollView style={styles.resultContainer} contentContainerStyle={styles.resultScrollContent}>
          <Image source={{ uri: photo }} style={styles.photo} />

          {analyzing ? (
            <View style={styles.analyzingContainer}>
              <ActivityIndicator size="large" color={Colors.accent} />
              <Text style={styles.analyzingText}>Analyse en cours...</Text>
            </View>
          ) : result ? (
            <View style={styles.resultCard}>
              <View style={styles.resultHeader}>
                <View style={styles.plantNameContainer}>
                  <Text style={styles.plantName}>{result.name}</Text>
                  <Text style={styles.plantScientific}>{result.scientificName}</Text>
                </View>
                <View style={styles.confidenceBadge}>
                  <Text style={styles.confidenceText}>{Math.round(result.confidence * 100)}%</Text>
                </View>
              </View>

              <Text style={styles.plantDescription}>{result.description}</Text>

              {result.tips && (
                <View style={styles.tipsCard}>
                  <Ionicons name="bulb" size={20} color={Colors.accent} />
                  <Text style={styles.tipsText}>{result.tips}</Text>
                </View>
              )}

              {result.sunlight && (
                <View style={styles.infoItem}>
                  <Ionicons name="sunny" size={18} color={Colors.primary} />
                  <Text style={styles.infoLabel}>Luminosité :</Text>
                  <Text style={styles.infoValue}>{result.sunlight}</Text>
                </View>
              )}

              {result.difficulty && (
                <View style={styles.infoItem}>
                  <Ionicons name="stats-chart" size={18} color={Colors.primary} />
                  <Text style={styles.infoLabel}>Difficulté :</Text>
                  <Text style={styles.infoValue}>{result.difficulty}</Text>
                </View>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity style={styles.addButton} onPress={handleAddPlant}>
                  <Ionicons name="add-circle" size={20} color={Colors.dark} />
                  <Text style={styles.addButtonText}>Ajouter à mon jardin</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    setPhoto(null);
                    setResult(null);
                  }}
                >
                  <Ionicons name="refresh" size={20} color={Colors.text} />
                  <Text style={styles.retryButtonText}>Réessayer</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}
        </ScrollView>
      )}
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
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  permissionText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  cameraContainer: {
    flex: 1,
    padding: 16,
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  cameraText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  buttonContainer: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.accent,
    paddingVertical: 16,
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
    color: Colors.dark,
  },
  actionButtonTextSecondary: {
    color: Colors.text,
  },
  resultContainer: {
    flex: 1,
    padding: 16,
  },
  photo: {
    width: '100%',
    height: 250,
    borderRadius: 16,
    marginBottom: 16,
  },
  analyzingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  analyzingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  resultCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  plantNameContainer: {
    flex: 1,
    marginRight: 12,
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  confidenceBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  confidenceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  plantDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  resultScrollContent: {
    paddingBottom: 100,
  },
  tipsCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.accent + '20',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  tipsText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingVertical: 14,
    borderRadius: 12,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
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
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
});
