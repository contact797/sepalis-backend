import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function About() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header avec retour */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>À Propos</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Badge MOF */}
      <View style={styles.badgeContainer}>
        <View style={styles.mofBadge}>
          <Text style={styles.mofBadgeText}>MOF</Text>
        </View>
        <Text style={styles.mofTitle}>Meilleur Ouvrier de France</Text>
        <Text style={styles.mofSubtitle}>Paysagiste</Text>
      </View>

      {/* Photo de profil (placeholder) */}
      <View style={styles.profileImageContainer}>
        <View style={styles.profileImage}>
          <Ionicons name="person" size={80} color={Colors.accent} />
        </View>
      </View>

      {/* Nom */}
      <Text style={styles.name}>Créateur de Sepalis</Text>

      {/* Bio */}
      <View style={styles.bioSection}>
        <Text style={styles.bioTitle}>Une Expertise Reconnue</Text>
        <Text style={styles.bioText}>
          Sepalis a été créée par un Meilleur Ouvrier de France en paysagisme, 
          la plus haute distinction française dans le domaine des métiers d'art et de l'artisanat.
        </Text>
        <Text style={styles.bioText}>
          Cette application combine des années d'expertise terrain avec les technologies 
          les plus modernes pour vous offrir les meilleurs conseils de jardinage.
        </Text>
      </View>

      {/* Valeurs */}
      <View style={styles.valuesSection}>
        <Text style={styles.sectionTitle}>Nos Valeurs</Text>
        
        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Ionicons name="trophy" size={24} color={Colors.accent} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Excellence</Text>
            <Text style={styles.valueText}>
              Des conseils basés sur l'expertise MOF et les meilleures pratiques du métier.
            </Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Ionicons name="leaf" size={24} color={Colors.accent} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Passion</Text>
            <Text style={styles.valueText}>
              Un amour profond pour les plantes et le jardinage, transmis à travers l'application.
            </Text>
          </View>
        </View>

        <View style={styles.valueCard}>
          <View style={styles.valueIcon}>
            <Ionicons name="bulb" size={24} color={Colors.accent} />
          </View>
          <View style={styles.valueContent}>
            <Text style={styles.valueTitle}>Innovation</Text>
            <Text style={styles.valueText}>
              L'alliance parfaite entre savoir-faire traditionnel et technologies modernes.
            </Text>
          </View>
        </View>
      </View>

      {/* Mission */}
      <View style={styles.missionSection}>
        <Text style={styles.sectionTitle}>Notre Mission</Text>
        <Text style={styles.missionText}>
          Rendre le jardinage accessible à tous, en combinant l'expertise d'un 
          Meilleur Ouvrier de France avec l'intelligence artificielle et des 
          fonctionnalités modernes. Chaque jardinier, débutant ou confirmé, 
          mérite d'avoir accès aux meilleurs conseils.
        </Text>
      </View>

      {/* Contact */}
      <View style={styles.contactSection}>
        <Text style={styles.sectionTitle}>Contact</Text>
        <TouchableOpacity style={styles.contactButton}>
          <Ionicons name="mail" size={20} color={Colors.accent} />
          <Text style={styles.contactButtonText}>contact@sepalis.fr</Text>
        </TouchableOpacity>
      </View>

      {/* Version */}
      <Text style={styles.version}>Sepalis v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
  },
  placeholder: {
    width: 40,
  },
  badgeContainer: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  mofBadge: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.accent + '20',
    borderWidth: 4,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  mofBadgeText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.accent,
  },
  mofTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  mofSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: Colors.accent,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 32,
  },
  bioSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  bioTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  bioText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  valuesSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  valueCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  valueIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  valueText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  missionSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  missionText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  contactSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  contactButtonText: {
    fontSize: 16,
    color: Colors.accent,
    fontWeight: '500',
  },
  version: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});
