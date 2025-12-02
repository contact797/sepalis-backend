import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function WorkshopDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const workshop = params.workshop ? JSON.parse(params.workshop as string) : null;

  if (!workshop) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Atelier non trouvé</Text>
      </View>
    );
  }

  const handleBookNow = () => {
    router.push({
      pathname: '/(tabs)/workshop-booking',
      params: { workshop: JSON.stringify(workshop) },
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de l'atelier</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Image */}
        {workshop.image && (
          <Image
            source={{ uri: workshop.image }}
            style={styles.workshopImage}
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Title and Level */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>{workshop.title}</Text>
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>{workshop.level}</Text>
            </View>
          </View>

          {/* Meta Info */}
          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={18} color={Colors.accent} />
              <Text style={styles.metaText}>{workshop.date}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="time-outline" size={18} color={Colors.accent} />
              <Text style={styles.metaText}>{workshop.duration}</Text>
            </View>
          </View>

          <View style={styles.metaContainer}>
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={18} color={Colors.accent} />
              <Text style={styles.metaText}>{workshop.location}</Text>
            </View>
            <View style={styles.metaRow}>
              <Ionicons name="cash-outline" size={18} color={Colors.accent} />
              <Text style={styles.metaText}>{workshop.price}€ / personne</Text>
            </View>
          </View>

          {/* Instructor */}
          <View style={styles.instructorSection}>
            <View style={styles.instructorIcon}>
              <Ionicons name="person" size={24} color={Colors.accent} />
            </View>
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorLabel}>Formateur</Text>
              <Text style={styles.instructorName}>{workshop.instructor}</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 Description</Text>
            <Text style={styles.description}>{workshop.description}</Text>
          </View>

          {/* Topics */}
          {workshop.topics && workshop.topics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>🎯 Thèmes abordés</Text>
              <View style={styles.topicsContainer}>
                {workshop.topics.map((topic: string, index: number) => (
                  <View key={index} style={styles.topicBadge}>
                    <Text style={styles.topicText}>{topic}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Availability */}
          <View style={styles.availabilityCard}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <View style={styles.availabilityInfo}>
              <Text style={styles.availabilityLabel}>Places disponibles</Text>
              <Text style={styles.availabilityCount}>
                {workshop.availableSpots} / {workshop.maxParticipants}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.footer}>
        <View style={styles.priceSection}>
          <Text style={styles.priceLabel}>À partir de</Text>
          <Text style={styles.priceAmount}>{workshop.price}€</Text>
        </View>
        <TouchableOpacity
          style={styles.bookButton}
          onPress={handleBookNow}
        >
          <Ionicons name="calendar" size={20} color={Colors.dark} />
          <Text style={styles.bookButtonText}>Réserver maintenant</Text>
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
    paddingBottom: 120,
  },
  workshopImage: {
    width: '100%',
    height: 250,
  },
  content: {
    padding: 20,
  },
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 12,
  },
  levelBadge: {
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  levelBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.accent,
  },
  metaContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  instructorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  instructorIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  instructorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  topicsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  topicBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  topicText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  availabilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  availabilityInfo: {
    flex: 1,
  },
  availabilityLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  availabilityCount: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  priceSection: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  priceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
