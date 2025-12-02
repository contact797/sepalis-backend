import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { plantsAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Plants() {
  const router = useRouter();
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPlants();
  }, []);

  const loadPlants = async () => {
    try {
      const response = await plantsAPI.getUserPlants();
      setPlants(response.data);
    } catch (error) {
      console.error('Erreur chargement plantes:', error);
      Alert.alert('Erreur', 'Impossible de charger les plantes');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPlants();
  };

  const handleAddPlant = () => {
    router.push('/(tabs)/add-plant');
  };

  const handleDeletePlant = async (plantId: string) => {
    Alert.alert(
      'Supprimer la plante',
      'Êtes-vous sûr de vouloir supprimer cette plante ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await plantsAPI.deletePlant(plantId);
              loadPlants();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer la plante');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {plants.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="leaf-outline" size={80} color={Colors.mediumGray} />
            <Text style={styles.emptyTitle}>Aucune plante</Text>
            <Text style={styles.emptyText}>
              Commencez à créer votre jardin en ajoutant votre première plante
            </Text>
            <TouchableOpacity style={styles.emptyButton} onPress={handleAddPlant}>
              <Text style={styles.emptyButtonText}>Ajouter une plante</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.plantsGrid}>
            {plants.map((plant: any) => (
              <TouchableOpacity
                key={plant._id}
                style={styles.plantCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/plant-detail',
                  params: { plant: JSON.stringify(plant) }
                })}
                onLongPress={() => handleDeletePlant(plant._id)}
              >
                <View style={styles.plantImage}>
                  <Ionicons name="leaf" size={40} color={Colors.primary} />
                </View>
                <View style={styles.plantInfo}>
                  <Text style={styles.plantName}>{plant.name}</Text>
                  {plant.scientificName && (
                    <Text style={styles.plantScientific}>{plant.scientificName}</Text>
                  )}
                  {plant.zoneName && (
                    <View style={styles.zoneTag}>
                      <Ionicons name="location" size={12} color={Colors.accent} />
                      <Text style={styles.zoneTagText}>{plant.zoneName}</Text>
                    </View>
                  )}
                  <View style={styles.plantMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="water" size={14} color={Colors.primary} />
                      <Text style={styles.metaText}>
                        {plant.wateringFrequency || '7'} jours
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.fabContainer}>
        <TouchableOpacity style={styles.fabSecondary} onPress={() => router.push('/(tabs)/scan-plant')}>
          <Ionicons name="camera" size={24} color={Colors.white} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={handleAddPlant}>
          <Ionicons name="add" size={28} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  plantsGrid: {
    padding: 16,
  },
  plantCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  plantImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  plantInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  plantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  plantScientific: {
    fontSize: 14,
    color: Colors.mediumGray,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  zoneTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  zoneTagText: {
    fontSize: 11,
    color: Colors.accent,
    fontWeight: '600',
  },
  plantMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  fabContainer: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    flexDirection: 'row',
    gap: 12,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabSecondary: {
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
});
