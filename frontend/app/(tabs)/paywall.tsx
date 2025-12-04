import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { subscriptionService } from '../../services/subscriptionService';
import { subscriptionAPI } from '../../services/api';
import { Confetti } from '../../components/Confetti';
import { haptics } from '../../utils/haptics';

export default function Paywall() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfetti, setShowConfetti] = useState(false);

  const handleStartTrial = async () => {
    setPurchasing(true);
    setSuccessMessage('');
    setErrorMessage('');
    
    try {
      console.log('🚀 Démarrage essai gratuit...');
      const response = await subscriptionAPI.startTrial();
      console.log('✅ Réponse succès:', response.data);
      
      if (response.data.success) {
        haptics.success(); // Vibration de succès
        setSuccessMessage('✅ Essai Démarré ! Profitez de 7 jours gratuits de Sepalis Premium');
        setShowConfetti(true);
        setTimeout(() => router.back(), 3000);
      } else {
        haptics.error(); // Vibration d'erreur
        setErrorMessage('❌ Impossible de démarrer l\'essai gratuit');
      }
    } catch (error: any) {
      console.log('❌ Erreur complète:', error);
      console.log('❌ Response:', error.response);
      console.log('❌ Data:', error.response?.data);
      console.log('❌ Detail:', error.response?.data?.detail);
      
      const errorMsg = error.response?.data?.detail || error.message || 'Une erreur est survenue';
      console.log('❌ Message final:', errorMsg);
      
      // Message plus user-friendly
      if (errorMsg.toLowerCase().includes('already') || 
          errorMsg.toLowerCase().includes('déjà') || 
          errorMsg.toLowerCase().includes('actif')) {
        setSuccessMessage('✅ Vous avez déjà un essai Premium actif ! Profitez-en.');
        setTimeout(() => router.back(), 2000);
      } else {
        setErrorMessage(`❌ ${errorMsg}`);
      }
    } finally {
      setPurchasing(false);
    }
  };

  const handlePurchase = async () => {
    Alert.alert(
      'Mode Démo',
      'L\'achat réel sera disponible une fois RevenueCat configuré. En attendant, utilisez le bouton "Démarrer l\'Essai Gratuit" pour tester.',
      [{ text: 'OK' }]
    );
  };

  const handleRestore = async () => {
    Alert.alert(
      'Restauration',
      'La restauration d\'achats sera disponible avec RevenueCat configuré.',
      [{ text: 'OK' }]
    );
  };

  const features = [
    {
      icon: 'infinite',
      title: 'Zones illimitées',
      description: 'Créez autant de zones que vous voulez',
    },
    {
      icon: 'leaf',
      title: 'Plantes illimitées',
      description: 'Suivez toutes vos plantes sans limite',
    },
    {
      icon: 'sunny',
      title: 'Météo & Conseils',
      description: 'Prévisions et recommandations personnalisées',
    },
    {
      icon: 'bulb',
      title: 'Suggestions Automatiques',
      description: 'Tâches générées selon la saison',
    },
    {
      icon: 'bar-chart',
      title: 'Graphiques & Stats',
      description: 'Visualisez l\'évolution de votre jardin',
    },
    {
      icon: 'trophy',
      title: 'Gamification',
      description: 'Badges, niveaux et progression',
    },
    {
      icon: 'cloud-offline',
      title: 'Mode Hors Ligne',
      description: 'Accédez à vos données partout',
    },
    {
      icon: 'notifications',
      title: 'Notifications',
      description: 'Rappels et alertes personnalisés',
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Confetti */}
      {showConfetti && <Confetti onComplete={() => setShowConfetti(false)} />}

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.crownBadge}>
          <Ionicons name="diamond" size={40} color={Colors.accent} />
        </View>
        <Text style={styles.heroTitle}>Sepalis Premium</Text>
        <Text style={styles.heroSubtitle}>
          Conseils d'expert par un Meilleur Ouvrier de France
        </Text>
        <View style={styles.mofBadge}>
          <Ionicons name="trophy" size={16} color={Colors.accent} />
          <Text style={styles.mofBadgeText}>MOF Paysagiste</Text>
        </View>
      </View>

      {/* Trial Banner */}
      <View style={styles.trialBanner}>
        <Ionicons name="gift" size={24} color={Colors.accent} />
        <View style={styles.trialText}>
          <Text style={styles.trialTitle}>Essai Gratuit 7 Jours</Text>
          <Text style={styles.trialSubtitle}>Annulez quand vous voulez</Text>
        </View>
      </View>

      {/* Features */}
      <View style={styles.featuresSection}>
        <Text style={styles.sectionTitle}>Tout ce dont vous avez besoin</Text>
        <View style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIcon}>
                <Ionicons name={feature.icon as any} size={24} color={Colors.accent} />
              </View>
              <Text style={styles.featureTitle}>{feature.title}</Text>
              <Text style={styles.featureDescription}>{feature.description}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Plans */}
      <View style={styles.plansSection}>
        <Text style={styles.sectionTitle}>Choisissez votre plan</Text>
        
        {/* Yearly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === 'yearly' && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan('yearly')}
        >
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>POPULAIRE</Text>
          </View>
          <View style={styles.planHeader}>
            <View style={styles.planRadio}>
              {selectedPlan === 'yearly' && (
                <View style={styles.planRadioSelected} />
              )}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>Annuel</Text>
              <Text style={styles.planPrice}>99€/an</Text>
              <Text style={styles.planSaving}>Économisez 17% 🎉</Text>
            </View>
            <Text style={styles.planPerMonth}>8.25€/mois</Text>
          </View>
        </TouchableOpacity>

        {/* Monthly Plan */}
        <TouchableOpacity
          style={[
            styles.planCard,
            selectedPlan === 'monthly' && styles.planCardSelected,
          ]}
          onPress={() => setSelectedPlan('monthly')}
        >
          <View style={styles.planHeader}>
            <View style={styles.planRadio}>
              {selectedPlan === 'monthly' && (
                <View style={styles.planRadioSelected} />
              )}
            </View>
            <View style={styles.planInfo}>
              <Text style={styles.planTitle}>Mensuel</Text>
              <Text style={styles.planPrice}>9.99€/mois</Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        {/* Success Message */}
        {successMessage && (
          <View style={styles.successMessage}>
            <Text style={styles.successMessageText}>{successMessage}</Text>
          </View>
        )}

        {/* Error Message */}
        {errorMessage && (
          <View style={styles.errorMessage}>
            <Text style={styles.errorMessageText}>{errorMessage}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.primaryButton, purchasing && styles.buttonDisabled]}
          onPress={handleStartTrial}
          disabled={purchasing}
        >
          {purchasing ? (
            <ActivityIndicator color={Colors.dark} />
          ) : (
            <>
              <Text style={styles.primaryButtonText}>Démarrer l'Essai Gratuit</Text>
              <Text style={styles.primaryButtonSubtext}>7 jours gratuits, puis {selectedPlan === 'yearly' ? '99€/an' : '9.99€/mois'}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.restoreButton}
          onPress={handleRestore}
          disabled={purchasing}
        >
          <Text style={styles.restoreButtonText}>Restaurer mes achats</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          L'abonnement sera renouvelé automatiquement. Vous pouvez annuler à tout moment depuis les paramètres de votre compte.
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
  content: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingTop: 60,
  },
  closeButton: {
    padding: 8,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  crownBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  mofBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  mofBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.accent,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent + '20',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 32,
    gap: 12,
  },
  trialText: {
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  trialSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.accent + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  plansSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    position: 'relative',
  },
  planCardSelected: {
    borderColor: Colors.accent,
    backgroundColor: Colors.accent + '10',
  },
  popularBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  popularText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.accent,
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  planSaving: {
    fontSize: 13,
    color: Colors.success,
    marginTop: 2,
  },
  planPerMonth: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ctaSection: {
    paddingHorizontal: 20,
  },
  successMessage: {
    backgroundColor: Colors.success + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  successMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },
  errorMessage: {
    backgroundColor: Colors.warning + '20',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  errorMessageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.warning,
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.accent,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.dark,
  },
  primaryButtonSubtext: {
    fontSize: 13,
    color: Colors.dark,
    opacity: 0.8,
    marginTop: 4,
  },
  restoreButton: {
    padding: 16,
    alignItems: 'center',
  },
  restoreButtonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textDecorationLine: 'underline',
  },
  footer: {
    paddingHorizontal: 40,
    marginTop: 16,
  },
  footerText: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
