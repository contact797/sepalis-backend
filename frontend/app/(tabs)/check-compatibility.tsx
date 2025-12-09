import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CheckCompatibility() {
  const router = useRouter();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePhoto = async () => {
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      analyzePhoto(result.assets[0].base64);
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0].base64) {
      setPhoto(`data:image/jpeg;base64,${result.assets[0].base64}`);
      analyzePhoto(result.assets[0].base64);
    }
  };

  const analyzePhoto = async (base64: string) => {
    try {
      setAnalyzing(true);
      setResult(null);
      setError(null);

      console.log('🔍 Début analyse compatibilité...');
      
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/ai/check-plant-compatibility`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image: base64,  // Enlever le préfixe car il sera ajouté côté backend si nécessaire
          }),
        }
      );

      console.log('📡 Réponse reçue:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Données reçues:', data);
        setResult(data);
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.detail || 'Impossible d\'analyser la plante';
        console.error('❌ Erreur API:', errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('❌ Erreur analyse:', error);
      setError(error.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent':
        return Colors.success;
      case 'good':
        return Colors.primary;
      case 'fair':
        return Colors.warning;
      case 'poor':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'checkmark-circle';
      case 'good':
        return 'checkmark';
      case 'fair':
        return 'warning';
      case 'poor':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'Parfaitement compatible';
      case 'good':
        return 'Compatible';
      case 'fair':
        return 'Compatible avec ajustements';
      case 'poor':
        return 'Incompatible';
      default:
        return 'Indéterminé';
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator /></View>;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>Accès à la caméra refusé</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scanner Compatibilité</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {!photo ? (
          <View style={styles.captureSection}>
            <Ionicons name="scan" size={80} color={Colors.primary} />
            <Text style={styles.captureTitle}>Scanner une plante</Text>
            <Text style={styles.captureDesc}>
              Prenez en photo une plante en jardinerie pour vérifier sa compatibilité avec vos zones
            </Text>

            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <Ionicons name="camera" size={24} color={Colors.white} />
              <Text style={styles.captureButtonText}>Prendre une photo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryButton} onPress={pickImage}>
              <Ionicons name="images" size={24} color={Colors.primary} />
              <Text style={styles.galleryButtonText}>Choisir depuis la galerie</Text>
            </TouchableOpacity>
          </View>
        ) : analyzing ? (
          <View style={styles.analyzingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.analyzingText}>Analyse en cours...</Text>
            <Text style={styles.analyzingSubtext}>
              Identification de la plante et analyse de compatibilité avec vos zones
            </Text>
          </View>
        ) : result ? (
          <View style={styles.resultsContainer}>
            {/* Info plante */}
            <View style={styles.plantInfo}>
              <Text style={styles.plantName}>{result.plant?.name}</Text>
              <Text style={styles.plantScientific}>{result.plant?.scientificName}</Text>
              <Text style={styles.plantCategory}>
                <Ionicons name="leaf" size={16} /> {result.plant?.category}
              </Text>
            </View>

            {/* Besoins de la plante */}
            <View style={styles.requirementsSection}>
              <Text style={styles.sectionTitle}>Besoins de la plante</Text>
              <View style={styles.requirementsList}>
                {result.plant?.requirements?.sunlight && (
                  <View style={styles.requirementItem}>
                    <Ionicons name="sunny" size={18} color={Colors.warning} />
                    <Text style={styles.requirementText}>{result.plant.requirements.sunlight}</Text>
                  </View>
                )}
                {result.plant?.requirements?.soilType && (
                  <View style={styles.requirementItem}>
                    <Ionicons name="flower" size={18} color={Colors.primary} />
                    <Text style={styles.requirementText}>{result.plant.requirements.soilType}</Text>
                  </View>
                )}
                {result.plant?.requirements?.humidity && (
                  <View style={styles.requirementItem}>
                    <Ionicons name="water" size={18} color={Colors.primary} />
                    <Text style={styles.requirementText}>{result.plant.requirements.humidity}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Compatibilité par zone */}
            <Text style={styles.compatibilityTitle}>Compatibilité avec vos zones</Text>
            
            {result.compatibility?.map((zone: any, index: number) => (
              <View key={index} style={styles.zoneCard}>
                <View style={styles.zoneHeader}>
                  <View>
                    <Text style={styles.zoneName}>{zone.zoneName}</Text>
                    <View style={styles.statusBadge}>
                      <Ionicons
                        name={getStatusIcon(zone.status) as any}
                        size={16}
                        color={getStatusColor(zone.status)}
                      />
                      <Text style={[styles.statusText, { color: getStatusColor(zone.status) }]}>
                        {getStatusLabel(zone.status)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: getStatusColor(zone.status) + '20' }]}>
                    <Text style={[styles.scoreText, { color: getStatusColor(zone.status) }]}>
                      {zone.score}%
                    </Text>
                  </View>
                </View>

                <Text style={styles.explanation}>{zone.explanation}</Text>

                {zone.pros && zone.pros.length > 0 && (
                  <View style={styles.prosConsSection}>
                    <Text style={styles.prosConsTitle}>✅ Avantages</Text>
                    {zone.pros.map((pro: string, i: number) => (
                      <Text key={i} style={styles.prosConsText}>• {pro}</Text>
                    ))}
                  </View>
                )}

                {zone.cons && zone.cons.length > 0 && (
                  <View style={styles.prosConsSection}>
                    <Text style={styles.prosConsTitle}>⚠️ Points d'attention</Text>
                    {zone.cons.map((con: string, i: number) => (
                      <Text key={i} style={styles.prosConsText}>• {con}</Text>
                    ))}
                  </View>
                )}

                {zone.recommendations && (
                  <View style={styles.recommendationsSection}>
                    <Text style={styles.recommendationsTitle}>
                      <Ionicons name="bulb" size={16} color={Colors.accent} /> Conseils MOF
                    </Text>
                    <Text style={styles.recommendationsText}>{zone.recommendations}</Text>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setPhoto(null);
                setResult(null);
              }}
            >
              <Ionicons name="refresh" size={20} color={Colors.white} />
              <Text style={styles.retryButtonText}>Scanner une autre plante</Text>
            </TouchableOpacity>
          </View>
        ) : null}
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
    padding: 20,
    paddingTop: 60,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  content: {
    flex: 1,
  },
  captureSection: {
    alignItems: 'center',
    padding: 40,
  },
  captureTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 20,
    marginBottom: 12,
  },
  captureDesc: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  captureButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  galleryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.backgroundLight,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  galleryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  analyzingContainer: {
    alignItems: 'center',
    padding: 40,
  },
  analyzingText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginTop: 20,
  },
  analyzingSubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  resultsContainer: {
    padding: 20,
  },
  plantInfo: {
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  plantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  plantScientific: {
    fontSize: 16,
    fontStyle: 'italic',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  plantCategory: {
    fontSize: 14,
    color: Colors.accent,
  },
  requirementsSection: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  requirementsList: {
    gap: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  requirementText: {
    fontSize: 14,
    color: Colors.text,
  },
  compatibilityTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  zoneCard: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  zoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  zoneName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  scoreBadge: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  scoreText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  explanation: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 12,
  },
  prosConsSection: {
    marginBottom: 12,
  },
  prosConsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  prosConsText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginLeft: 8,
  },
  recommendationsSection: {
    backgroundColor: Colors.primary + '10',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  recommendationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
    marginBottom: 8,
  },
  recommendationsText: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
