import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';

interface ExpiredTrialModalProps {
  visible: boolean;
}

export function ExpiredTrialModal({ visible }: ExpiredTrialModalProps) {
  const router = useRouter();

  const features = [
    { icon: 'infinite', title: 'Zones & Plantes illimitées' },
    { icon: 'sunny', title: 'Météo & Conseils personnalisés' },
    { icon: 'bulb', title: 'Suggestions automatiques de tâches' },
    { icon: 'bar-chart', title: 'Graphiques & Statistiques' },
    { icon: 'trophy', title: 'Gamification & Badges' },
    { icon: 'cloud-offline', title: 'Mode Hors Ligne' },
    { icon: 'notifications', title: 'Notifications personnalisées' },
  ];

  const handleSubscribe = () => {
    router.push('/paywall');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.iconBadge}>
              <Ionicons name="hourglass-outline" size={60} color={Colors.accent} />
            </View>
            <Text style={styles.heroTitle}>Votre essai est terminé</Text>
            <Text style={styles.heroSubtitle}>
              Vous avez profité de 7 jours gratuits de Sepalis Premium.
              Continuez l'aventure dès maintenant !
            </Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresSection}>
            <Text style={styles.sectionTitle}>
              Ce que vous allez retrouver :
            </Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <View style={styles.featureIcon}>
                    <Ionicons
                      name={feature.icon as any}
                      size={20}
                      color={Colors.accent}
                    />
                  </View>
                  <Text style={styles.featureText}>{feature.title}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Pricing */}
          <View style={styles.pricingSection}>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>À partir de</Text>
              <Text style={styles.priceValue}>4.92€/mois</Text>
              <Text style={styles.priceDetail}>Facturé 59€/an • Économisez 16%</Text>
            </View>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={styles.subscribeButton}
            onPress={handleSubscribe}
            activeOpacity={0.8}
          >
            <Text style={styles.subscribeButtonText}>
              Continuer avec Premium
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.dark} />
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            Annulable à tout moment • Sans engagement
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBadge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  featuresSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  pricingSection: {
    marginBottom: 24,
  },
  priceCard: {
    backgroundColor: Colors.accent + '15',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.accent,
    marginBottom: 4,
  },
  priceDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  subscribeButton: {
    backgroundColor: Colors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  subscribeButtonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  footer: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
