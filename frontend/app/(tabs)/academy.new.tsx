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
import { coursesAPI, workshopsAPI } from '../../services/api';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Academy() {
  const [courses, setCourses] = useState([]);
  const [workshops, setWorkshops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'courses' | 'workshops'>('courses');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [coursesResponse, workshopsResponse] = await Promise.all([
        coursesAPI.getCourses(),
        workshopsAPI.getWorkshops(),
      ]);
      setCourses(coursesResponse.data);
      setWorkshops(workshopsResponse.data);
    } catch (error) {
      console.error('Erreur chargement données:', error);
      Alert.alert('Erreur', 'Impossible de charger les formations et ateliers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handlePreregisterCourse = async (course: any) => {
    Alert.alert(
      'Pré-inscription',
      `Souhaitez-vous vous pré-inscrire à la formation "${course.title}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await coursesAPI.preregister({ courseSlug: course.slug });
              Alert.alert('Succès', 'Pré-inscription enregistrée ! Vous recevrez un email de confirmation.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de s\'inscrire');
            }
          },
        },
      ]
    );
  };

  const handleBookWorkshop = async (workshop: any) => {
    if (workshop.availableSpots === 0) {
      Alert.alert('Complet', 'Cet atelier est complet. Voulez-vous être ajouté sur liste d\'attente ?');
      return;
    }

    Alert.alert(
      'Réservation',
      `Souhaitez-vous réserver une place pour l'atelier "${workshop.title}" ?\n\nDate : ${workshop.date}\nLieu : ${workshop.location}\nPrix : ${workshop.price}€`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Réserver',
          onPress: async () => {
            try {
              await workshopsAPI.bookWorkshop({ workshopSlug: workshop.slug });
              Alert.alert('Succès', 'Votre place est réservée ! Vous recevrez un email de confirmation.');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de réserver');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
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
          tintColor={Colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Académie Sepalis</Text>
        <Text style={styles.headerSubtitle}>
          Formations et ateliers avec Nicolas Blot, Meilleur Ouvrier de France
        </Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'courses' && styles.tabActive]}
          onPress={() => setActiveTab('courses')}
        >
          <Ionicons 
            name="play-circle-outline" 
            size={20} 
            color={activeTab === 'courses' ? Colors.dark : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'courses' && styles.tabTextActive]}>
            Formations ({courses.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'workshops' && styles.tabActive]}
          onPress={() => setActiveTab('workshops')}
        >
          <Ionicons 
            name="people-outline" 
            size={20} 
            color={activeTab === 'workshops' ? Colors.dark : Colors.textSecondary} 
          />
          <Text style={[styles.tabText, activeTab === 'workshops' && styles.tabTextActive]}>
            Ateliers ({workshops.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'courses' ? (
          // Formations
          courses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="school-outline" size={80} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucune formation disponible</Text>
              <Text style={styles.emptyText}>
                Les formations seront bientôt disponibles
              </Text>
            </View>
          ) : (
            courses.map((course: any) => (
              <TouchableOpacity
                key={course.id}
                style={styles.card}
                onPress={() => handlePreregisterCourse(course)}
              >
                <View style={styles.cardImage}>
                  <Ionicons name="play-circle" size={60} color={Colors.accent} />
                  <View style={styles.levelBadge}>
                    <Text style={styles.levelBadgeText}>{course.level}</Text>
                  </View>
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{course.title}</Text>
                  <Text style={styles.cardInstructor}>
                    <Ionicons name="person" size={14} color={Colors.textSecondary} /> {course.instructor}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {course.description}
                  </Text>

                  {course.topics && course.topics.length > 0 && (
                    <View style={styles.topics}>
                      {course.topics.slice(0, 3).map((topic: string, index: number) => (
                        <View key={index} style={styles.topicChip}>
                          <Text style={styles.topicText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.cardMeta}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.cardMetaText}>{course.duration}</Text>
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>
                        {course.price > 0 ? `${course.price}€` : 'Gratuit'}
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        ) : (
          // Ateliers
          workshops.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={80} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucun atelier disponible</Text>
              <Text style={styles.emptyText}>
                Les ateliers seront bientôt disponibles
              </Text>
            </View>
          ) : (
            workshops.map((workshop: any) => (
              <TouchableOpacity
                key={workshop.id}
                style={styles.card}
                onPress={() => handleBookWorkshop(workshop)}
              >
                <View style={styles.cardImage}>
                  <Ionicons name="people" size={60} color={Colors.primary} />
                  {workshop.availableSpots <= 3 && (
                    <View style={styles.urgencyBadge}>
                      <Text style={styles.urgencyBadgeText}>
                        {workshop.availableSpots === 0 ? 'COMPLET' : `${workshop.availableSpots} places`}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardContent}>
                  <Text style={styles.cardTitle}>{workshop.title}</Text>
                  <Text style={styles.cardInstructor}>
                    <Ionicons name="person" size={14} color={Colors.textSecondary} /> {workshop.instructor}
                  </Text>
                  <Text style={styles.cardDescription} numberOfLines={3}>
                    {workshop.description}
                  </Text>

                  <View style={styles.workshopInfo}>
                    <View style={styles.workshopInfoItem}>
                      <Ionicons name="calendar-outline" size={16} color={Colors.accent} />
                      <Text style={styles.workshopInfoText}>{workshop.date}</Text>
                    </View>
                    <View style={styles.workshopInfoItem}>
                      <Ionicons name="location-outline" size={16} color={Colors.accent} />
                      <Text style={styles.workshopInfoText}>{workshop.location}</Text>
                    </View>
                  </View>

                  {workshop.topics && workshop.topics.length > 0 && (
                    <View style={styles.topics}>
                      {workshop.topics.slice(0, 3).map((topic: string, index: number) => (
                        <View key={index} style={styles.topicChip}>
                          <Text style={styles.topicText}>{topic}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <View style={styles.cardMeta}>
                      <Ionicons name="time-outline" size={16} color={Colors.textSecondary} />
                      <Text style={styles.cardMetaText}>{workshop.duration}</Text>
                    </View>
                    <View style={styles.priceTag}>
                      <Text style={styles.priceText}>{workshop.price}€</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )
        )}
      </View>

      {/* Footer Info */}
      <View style={styles.footerInfo}>
        <Ionicons name="shield-checkmark" size={24} color={Colors.accent} />
        <Text style={styles.footerInfoText}>
          Toutes les formations sont certifiées par Nicolas Blot, Meilleur Ouvrier de France Paysagiste
        </Text>
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
    backgroundColor: Colors.background,
  },
  header: {
    padding: 24,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tabsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.dark,
  },
  content: {
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
    color: Colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  card: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardImage: {
    height: 160,
    backgroundColor: Colors.backgroundLight,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  levelBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.dark,
  },
  urgencyBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: Colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  urgencyBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
  },
  cardContent: {
    padding: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  cardInstructor: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  workshopInfo: {
    marginBottom: 12,
    gap: 8,
  },
  workshopInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopInfoText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: '500',
  },
  topics: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  topicChip: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  topicText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  priceTag: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    margin: 16,
    padding: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  footerInfoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
