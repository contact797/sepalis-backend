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
import { coursesAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Academy() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  const loadCourses = async () => {
    try {
      const response = await coursesAPI.getCourses();
      setCourses(response.data);
    } catch (error) {
      console.error('Erreur chargement formations:', error);
      Alert.alert('Erreur', 'Impossible de charger les formations');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadCourses();
  };

  const handlePreregister = async (course: any) => {
    Alert.alert(
      'Pré-inscription',
      `Souhaitez-vous vous pré-inscrire à "${course.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await coursesAPI.preregister({ courseSlug: course.slug });
              Alert.alert('Succès', 'Pré-inscription enregistrée !');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de s\'inscrire');
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={Colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Académie Sepalis</Text>
        <Text style={styles.headerSubtitle}>
          Formations et ateliers pour devenir un expert du jardinage
        </Text>
      </View>

      <View style={styles.coursesContainer}>
        {courses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="school-outline" size={80} color={Colors.mediumGray} />
            <Text style={styles.emptyTitle}>Aucune formation disponible</Text>
            <Text style={styles.emptyText}>
              Les formations seront bientôt disponibles
            </Text>
          </View>
        ) : (
          courses.map((course: any) => (
            <TouchableOpacity
              key={course._id}
              style={styles.courseCard}
              onPress={() => handlePreregister(course)}
            >
              <View style={styles.courseImage}>
                <Ionicons name="play-circle" size={60} color={Colors.primary} />
              </View>
              <View style={styles.courseContent}>
                <View style={styles.courseBadge}>
                  <Text style={styles.courseBadgeText}>{course.level || 'Tous niveaux'}</Text>
                </View>
                <Text style={styles.courseTitle}>{course.title}</Text>
                <Text style={styles.courseDescription} numberOfLines={3}>
                  {course.description}
                </Text>
                <View style={styles.courseFooter}>
                  <View style={styles.courseMeta}>
                    <Ionicons name="time-outline" size={16} color={Colors.mediumGray} />
                    <Text style={styles.courseMetaText}>
                      {course.duration || '2h'}
                    </Text>
                  </View>
                  <View style={styles.coursePrice}>
                    <Text style={styles.coursePriceText}>
                      {course.price ? `${course.price}€` : 'Gratuit'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Section Ateliers */}
      <View style={styles.workshopsSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ateliers pratiques 2026</Text>
          <Ionicons name="calendar-outline" size={20} color={Colors.mediumGray} />
        </View>
        <Text style={styles.sectionSubtitle}>
          Découvrez nos ateliers pratiques pour apprendre en groupe
        </Text>
        <TouchableOpacity style={styles.workshopButton}>
          <Text style={styles.workshopButtonText}>Voir les ateliers</Text>
          <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
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
  header: {
    padding: 24,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: Colors.mediumGray,
    lineHeight: 22,
  },
  coursesContainer: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 32,
    marginTop: 50,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.mediumGray,
    textAlign: 'center',
  },
  courseCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  courseImage: {
    height: 180,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseContent: {
    padding: 16,
  },
  courseBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  courseBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  courseTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 8,
  },
  courseDescription: {
    fontSize: 14,
    color: Colors.mediumGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  courseFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  courseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseMetaText: {
    fontSize: 14,
    color: Colors.mediumGray,
  },
  coursePrice: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  coursePriceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  workshopsSection: {
    margin: 16,
    padding: 24,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.mediumGray,
    marginBottom: 16,
    lineHeight: 20,
  },
  workshopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 12,
  },
  workshopButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
});
