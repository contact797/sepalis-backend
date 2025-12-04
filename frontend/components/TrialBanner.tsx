import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors } from '../constants/Colors';
import { useSubscription } from '../contexts/SubscriptionContext';

export function TrialBanner() {
  const router = useRouter();
  const { isTrial, daysRemaining, isPremium } = useSubscription();

  // Ne pas afficher si l'utilisateur n'est pas en période d'essai
  if (!isTrial || !isPremium || daysRemaining === null) {
    return null;
  }

  // Couleur du banner selon les jours restants
  const getBannerColor = () => {
    if (daysRemaining <= 1) return '#ff6b6b'; // Rouge urgent
    if (daysRemaining <= 3) return '#ffa94d'; // Orange attention
    return Colors.accent; // Vert normal
  };

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: getBannerColor() + '20' }]}
      onPress={() => router.push('/paywall')}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="gift" size={20} color={getBannerColor()} />
        </View>
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            {daysRemaining === 0 
              ? 'Dernier jour d\'essai !' 
              : `${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} d'essai restant${daysRemaining > 1 ? 's' : ''}`
            }
          </Text>
          <Text style={styles.subtitle}>
            Profitez de toutes les fonctionnalités Premium
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.accent + '30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
