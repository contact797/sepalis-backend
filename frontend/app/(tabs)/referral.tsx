import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  premiumEarned: number;
  nextReward: string;
  progressToNext: number;
  badge: string | null;
  referrals: Array<{
    id: string;
    name: string;
    status: string;
    createdAt: string;
  }>;
}

export default function ReferralScreen() {
  const [loading, setLoading] = useState(true);
  const [referralCode, setReferralCode] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [showReferrals, setShowReferrals] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('authToken');

      // Récupérer le code
      const codeResponse = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/referral/code`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (codeResponse.ok) {
        const codeData = await codeResponse.json();
        setReferralCode(codeData.code);
        setShareMessage(codeData.shareMessage);
      }

      // Récupérer les stats
      const statsResponse = await fetch(
        `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/referral/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Erreur chargement parrainage:', error);
      Alert.alert('Erreur', 'Impossible de charger les données de parrainage');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(referralCode);
    Alert.alert('✅ Copié !', 'Ton code a été copié dans le presse-papier');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: shareMessage,
        title: 'Rejoins-moi sur Sepalis !',
      });
    } catch (error) {
      console.error('Erreur partage:', error);
    }
  };

  const getTierIcon = (tier: number) => {
    switch (tier) {
      case 0:
        return '🌱';
      case 1:
        return '🌿';
      case 2:
        return '🌳';
      case 3:
        return '👑';
      default:
        return '🌱';
    }
  };

  const getBadgeInfo = (badge: string | null) => {
    if (!badge) return null;
    
    const badges: Record<string, { title: string; icon: string; color: string }> = {
      ambassador: {
        title: 'Ambassadeur',
        icon: '🌟',
        color: Colors.accent,
      },
      super_ambassador: {
        title: 'Super Ambassadeur',
        icon: '⭐',
        color: '#FFD700',
      },
      legendary: {
        title: 'Légende Sepalis',
        icon: '👑',
        color: '#FF6B35',
      },
    };

    return badges[badge] || null;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const badgeInfo = getBadgeInfo(stats?.badge || null);
  const tiers = [
    { count: 1, reward: '1 mois Premium', unlocked: (stats?.totalReferrals || 0) >= 1 },
    { count: 3, reward: '3 mois + Badge', unlocked: (stats?.totalReferrals || 0) >= 3 },
    { count: 5, reward: '6 mois + Badge', unlocked: (stats?.totalReferrals || 0) >= 5 },
    { count: 10, reward: 'Premium À VIE', unlocked: (stats?.totalReferrals || 0) >= 10 },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      {/* Header avec badge */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎁 Parrainer & Gagner</Text>
        <Text style={styles.headerSubtitle}>
          Invite tes amis et gagne du Premium gratuit !
        </Text>
        {badgeInfo && (
          <View style={[styles.badge, { borderColor: badgeInfo.color }]}>
            <Text style={styles.badgeIcon}>{badgeInfo.icon}</Text>
            <Text style={[styles.badgeText, { color: badgeInfo.color }]}>
              {badgeInfo.title}
            </Text>
          </View>
        )}
      </View>

      {/* Code de parrainage */}
      <View style={styles.codeSection}>
        <Text style={styles.sectionLabel}>TON CODE UNIQUE</Text>
        <View style={styles.codeCard}>
          <Text style={styles.code}>{referralCode}</Text>
          <View style={styles.codeActions}>
            <TouchableOpacity style={styles.codeButton} onPress={handleCopyCode}>
              <Ionicons name="copy-outline" size={20} color={Colors.primary} />
              <Text style={styles.codeButtonText}>Copier</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.codeButton, styles.shareButton]} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={Colors.white} />
              <Text style={[styles.codeButtonText, styles.shareButtonText]}>Partager</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Statistiques */}
      <View style={styles.statsSection}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.totalReferrals || 0}</Text>
          <Text style={styles.statLabel}>Amis parrainés</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats?.premiumEarned || 0}</Text>
          <Text style={styles.statLabel}>Jours Premium</Text>
        </View>
      </View>

      {/* Progression */}
      <View style={styles.progressSection}>
        <View style={styles.progressHeader}>
          <Text style={styles.sectionLabel}>PROCHAIN PALIER</Text>
          <Text style={styles.progressText}>{Math.round((stats?.progressToNext || 0) * 100)}%</Text>
        </View>
        <Text style={styles.nextReward}>{stats?.nextReward}</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(stats?.progressToNext || 0) * 100}%` }]} />
        </View>
      </View>

      {/* Paliers de récompenses */}
      <View style={styles.tiersSection}>
        <Text style={styles.sectionLabel}>PALIERS DE RÉCOMPENSES</Text>
        {tiers.map((tier, index) => (
          <View
            key={index}
            style={[
              styles.tierCard,
              tier.unlocked && styles.tierCardUnlocked,
            ]}
          >
            <View style={styles.tierLeft}>
              <Text style={styles.tierIcon}>
                {tier.unlocked ? '✅' : '🔒'}
              </Text>
              <View style={styles.tierInfo}>
                <Text style={styles.tierCount}>{tier.count} ami{tier.count > 1 ? 's' : ''}</Text>
                <Text style={styles.tierReward}>{tier.reward}</Text>
              </View>
            </View>
            {tier.unlocked && (
              <View style={styles.tierBadge}>
                <Text style={styles.tierBadgeText}>Débloqué</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {/* Liste des filleuls */}
      {stats && stats.referrals.length > 0 && (
        <View style={styles.referralsSection}>
          <TouchableOpacity
            style={styles.referralsHeader}
            onPress={() => setShowReferrals(!showReferrals)}
          >
            <Text style={styles.sectionLabel}>MES FILLEULS ({stats.referrals.length})</Text>
            <Ionicons
              name={showReferrals ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={Colors.text}
            />
          </TouchableOpacity>

          {showReferrals && (
            <View style={styles.referralsList}>
              {stats.referrals.map((referral) => (
                <View key={referral.id} style={styles.referralCard}>
                  <View style={styles.referralIcon}>
                    <Ionicons name="person" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.referralInfo}>
                    <Text style={styles.referralName}>{referral.name}</Text>
                    <Text style={styles.referralDate}>
                      {new Date(referral.createdAt).toLocaleDateString('fr-FR')}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.referralStatus,
                      referral.status === 'active' && styles.referralStatusActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.referralStatusText,
                        referral.status === 'active' && styles.referralStatusTextActive,
                      ]}
                    >
                      {referral.status === 'active' ? 'Actif' : 'Inactif'}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Comment ça marche */}
      <View style={styles.howItWorksSection}>
        <Text style={styles.sectionLabel}>COMMENT ÇA MARCHE ?</Text>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>1</Text>
          </View>
          <Text style={styles.stepText}>Partage ton code unique avec tes amis</Text>
        </View>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>2</Text>
          </View>
          <Text style={styles.stepText}>
            Ton ami télécharge Sepalis et utilise ton code
          </Text>
        </View>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}>
            <Text style={styles.stepNumberText}>3</Text>
          </View>
          <Text style={styles.stepText}>
            Vous gagnez tous les deux du Premium gratuit ! 🎉
          </Text>
        </View>
      </View>

      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: Colors.primary + '10',
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
    textAlign: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  badgeIcon: {
    fontSize: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  codeSection: {
    padding: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 12,
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 2,
  },
  codeActions: {
    flexDirection: 'row',
    gap: 12,
  },
  codeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '20',
    paddingVertical: 12,
    borderRadius: 8,
  },
  shareButton: {
    backgroundColor: Colors.primary,
  },
  codeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  shareButtonText: {
    color: Colors.white,
  },
  statsSection: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  progressSection: {
    padding: 20,
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  nextReward: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  tiersSection: {
    padding: 20,
  },
  tierCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.6,
  },
  tierCardUnlocked: {
    opacity: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.primary + '10',
  },
  tierLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  tierIcon: {
    fontSize: 24,
  },
  tierInfo: {
    flex: 1,
  },
  tierCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  tierReward: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  tierBadge: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.white,
  },
  referralsSection: {
    padding: 20,
  },
  referralsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  referralsList: {
    gap: 8,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  referralIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  referralDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  referralStatus: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  referralStatusActive: {
    backgroundColor: Colors.primary + '20',
  },
  referralStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  referralStatusTextActive: {
    color: Colors.primary,
  },
  howItWorksSection: {
    padding: 20,
    backgroundColor: Colors.card,
    marginHorizontal: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 40,
  },
});
