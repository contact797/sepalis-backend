import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionData {
  isActive: boolean;
  isTrial: boolean;
  type: string;
  expiresAt: string;
  daysRemaining: number;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/subscription`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
      Alert.alert('Erreur', 'Impossible de charger les informations d\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    router.push('/(tabs)/paywall' as any);
  };

  const handleManageSubscription = () => {
    Alert.alert(
      'Gérer l\'abonnement',
      'Pour gérer votre abonnement, rendez-vous dans les paramètres Google Play.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Ouvrir Play Store',
          onPress: () => Linking.openURL('https://play.google.com/store/account/subscriptions'),
        },
      ]
    );
  };

  const getStatusIcon = () => {
    if (!subscription) return 'close-circle';
    if (subscription.isActive) return 'checkmark-circle';
    return 'time';
  };

  const getStatusColor = () => {
    if (!subscription) return Colors.error;
    if (subscription.isActive) return Colors.primary;
    return Colors.accent;
  };

  const getStatusText = () => {
    if (!subscription) return 'Aucun abonnement';
    if (subscription.isTrial) return 'Période d\'essai';
    if (subscription.type === 'lifetime') return 'Premium à vie';
    if (subscription.type === 'referral_earned') return 'Premium Parrainage';
    if (subscription.isActive) return 'Premium Actif';
    return 'Gratuit';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const isPremium = subscription?.isActive || false;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon abonnement</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Card */}
        <View style={[styles.statusCard, { borderColor: getStatusColor() }]}>
          <View style={styles.statusHeader}>
            <Ionicons name={getStatusIcon()} size={48} color={getStatusColor()} />
            <View style={styles.statusInfo}>
              <Text style={styles.statusTitle}>{getStatusText()}</Text>
              {subscription?.isActive && subscription.daysRemaining > 0 && (
                <Text style={styles.statusSubtitle}>
                  {subscription.daysRemaining} jour{subscription.daysRemaining > 1 ? 's' : ''} restant{subscription.daysRemaining > 1 ? 's' : ''}
                </Text>
              )}
              {subscription?.type === 'lifetime' && (
                <Text style={styles.statusSubtitle}>Accès illimité 🎉</Text>
              )}
            </View>
          </View>

          {subscription?.expiresAt && subscription.type !== 'lifetime' && (
            <View style={styles.expiryInfo}>
              <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.expiryText}>
                Expire le {new Date(subscription.expiresAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}
        </View>

        {/* Avantages Premium */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Avantages Premium</Text>
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name={isPremium ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={isPremium ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.featureText, !isPremium && styles.featureTextLocked]}>
                Scan de plantes illimité
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name={isPremium ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={isPremium ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.featureText, !isPremium && styles.featureTextLocked]}>
                Toutes les formations et ateliers
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name={isPremium ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={isPremium ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.featureText, !isPremium && styles.featureTextLocked]}>
                Conseils personnalisés avancés
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name={isPremium ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={isPremium ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.featureText, !isPremium && styles.featureTextLocked]}>
                Support prioritaire
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons
                name={isPremium ? 'checkmark-circle' : 'lock-closed'}
                size={24}
                color={isPremium ? Colors.primary : Colors.textSecondary}
              />
              <Text style={[styles.featureText, !isPremium && styles.featureTextLocked]}>
                Nouvelles fonctionnalités en avant-première
              </Text>
            </View>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!isPremium ? (
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Ionicons name="diamond" size={24} color={Colors.white} />
              <Text style={styles.upgradeButtonText}>Passer à Premium</Text>
            </TouchableOpacity>
          ) : (
            subscription?.type !== 'lifetime' && (
              <TouchableOpacity
                style={styles.manageButton}
                onPress={handleManageSubscription}
              >
                <Ionicons name="settings-outline" size={24} color={Colors.primary} />
                <Text style={styles.manageButtonText}>Gérer l'abonnement</Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Info */}
        <View style={styles.infoSection}>
          <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} />
          <Text style={styles.infoText}>
            {isPremium
              ? "Votre abonnement est géré via le Google Play Store. Les modifications et annulations se font depuis les paramètres de votre compte Google."
              : "Passez à Premium pour débloquer toutes les fonctionnalités et profiter pleinement de Sepalis."}
          </Text>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.card,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  statusSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  expiryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  expiryText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  featuresList: {
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: Colors.text,
  },
  featureTextLocked: {
    color: Colors.textSecondary,
  },
  actionsSection: {
    marginBottom: 16,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
  },
  upgradeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.primary + '20',
    padding: 16,
    borderRadius: 12,
  },
  manageButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  infoSection: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});