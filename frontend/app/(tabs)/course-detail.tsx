import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { coursesAPI } from '../../services/api';

export default function CourseDetail() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const course = params.course ? JSON.parse(params.course as string) : null;

  const handlePreregister = () => {
    router.push({
      pathname: '/(tabs)/course-preregister',
      params: { course: JSON.stringify(course) },
    });
  };

  if (!course) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Formation non trouvée</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la formation</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* En-tête formation */}
        <View style={styles.courseHeader}>
          <View style={styles.iconContainer}>
            <Ionicons name="school" size={48} color={Colors.accent} />
          </View>
          <Text style={styles.courseTitle}>{course.title}</Text>
          <Text style={styles.instructor}>
            <Ionicons name="person" size={14} color={Colors.accent} /> {course.instructor}
          </Text>
        </View>

        {/* Badges info */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Ionicons name="time" size={16} color={Colors.primary} />
            <Text style={styles.badgeText}>{course.duration}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="bar-chart" size={16} color={Colors.primary} />
            <Text style={styles.badgeText}>{course.level}</Text>
          </View>
          <View style={[styles.badge, styles.priceBadge]}>
            <Ionicons name="card" size={16} color={Colors.accent} />
            <Text style={styles.priceText}>{course.price}€</Text>
          </View>
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="document-text" size={20} color={Colors.accent} /> Description
          </Text>
          <Text style={styles.description}>{course.description}</Text>
        </View>

        {/* Sujets abordés */}
        {course.topics && course.topics.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              <Ionicons name="list" size={20} color={Colors.accent} /> Sujets abordés
            </Text>
            <View style={styles.topicsGrid}>
              {course.topics.map((topic: string, index: number) => (
                <View key={index} style={styles.topicChip}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.primary} />
                  <Text style={styles.topicText}>{topic}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Ce que vous allez apprendre */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="bulb" size={20} color={Colors.accent} /> Ce que vous allez apprendre
          </Text>
          <View style={styles.learningPoints}>
            <View style={styles.learningPoint}>
              <Ionicons name="leaf" size={20} color={Colors.primary} />
              <Text style={styles.learningText}>
                Techniques professionnelles certifiées par un Meilleur Ouvrier de France
              </Text>
            </View>
            <View style={styles.learningPoint}>
              <Ionicons name="camera" size={20} color={Colors.primary} />
              <Text style={styles.learningText}>
                Vidéos HD avec démonstrations pratiques étape par étape
              </Text>
            </View>
            <View style={styles.learningPoint}>
              <Ionicons name="document" size={20} color={Colors.primary} />
              <Text style={styles.learningText}>
                Fiches pratiques et calendriers à télécharger
              </Text>
            </View>
            <View style={styles.learningPoint}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.learningText}>
                Accès à vie aux contenus et mises à jour
              </Text>
            </View>
            <View style={styles.learningPoint}>
              <Ionicons name="people" size={20} color={Colors.primary} />
              <Text style={styles.learningText}>
                Communauté de jardiniers passionnés
              </Text>
            </View>
          </View>
        </View>

        {/* Instructeur */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Ionicons name="person-circle" size={20} color={Colors.accent} /> Votre instructeur
          </Text>
          <View style={styles.instructorCard}>
            <View style={styles.instructorIcon}>
              <Ionicons name="ribbon" size={32} color={Colors.accent} />
            </View>
            <View style={styles.instructorInfo}>
              <Text style={styles.instructorName}>Nicolas Blot</Text>
              <Text style={styles.instructorTitle}>Meilleur Ouvrier de France Paysagiste</Text>
              <Text style={styles.instructorBio}>
                Expert reconnu dans l'art du jardinage et du paysagisme, Nicolas partage son savoir-faire avec passion et pédagogie.
              </Text>
            </View>
          </View>
        </View>

        {/* Garantie */}
        <View style={styles.guaranteeCard}>
          <Ionicons name="shield-checkmark" size={32} color={Colors.success} />
          <View style={styles.guaranteeContent}>
            <Text style={styles.guaranteeTitle}>Garantie Satisfait ou Remboursé</Text>
            <Text style={styles.guaranteeText}>
              30 jours pour essayer la formation. Si elle ne vous convient pas, vous êtes remboursé intégralement.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bouton fixe en bas */}
      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.footerPriceLabel}>Prix</Text>
          <Text style={styles.footerPrice}>{course.price}€</Text>
        </View>
        <TouchableOpacity style={styles.registerButton} onPress={handlePreregister}>
          <Ionicons name="checkmark-circle" size={20} color={Colors.dark} />
          <Text style={styles.registerButtonText}>Me pré-inscrire</Text>
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
  courseHeader: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  instructor: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  badgesContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    backgroundColor: Colors.backgroundLight,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  priceBadge: {
    backgroundColor: Colors.accent + '20',
    borderColor: Colors.accent,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  priceText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  description: {
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  topicsGrid: {
    gap: 10,
  },
  topicChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topicText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  learningPoints: {
    gap: 16,
  },
  learningPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  learningText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  instructorCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  instructorIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructorInfo: {
    flex: 1,
  },
  instructorName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  instructorTitle: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '600',
    marginBottom: 8,
  },
  instructorBio: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  guaranteeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    margin: 16,
    padding: 20,
    backgroundColor: Colors.success + '10',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.success + '40',
  },
  guaranteeContent: {
    flex: 1,
  },
  guaranteeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  guaranteeText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 16,
  },
  priceContainer: {
    alignItems: 'center',
  },
  footerPriceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  footerPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  registerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.accent,
    padding: 16,
    borderRadius: 12,
  },
  registerButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
});
