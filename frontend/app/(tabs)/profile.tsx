import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isPremium, isTrial, expiresAt } = useSubscription();
  const router = useRouter();

  const handleLogout = async () => {
    console.log('🔴 Bouton déconnexion cliqué !');
    
    try {
      const confirmed = window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?');
      
      if (confirmed) {
        console.log('✅ Confirmation reçue, déconnexion...');
        await signOut();
        console.log('✅ SignOut terminé, redirection...');
        
        // Forcer le rechargement complet de la page
        window.location.href = '/';
      } else {
        console.log('❌ Déconnexion annulée par l\'utilisateur');
      }
    } catch (error) {
      console.error('❌ Erreur handleLogout:', error);
      alert('Erreur lors de la déconnexion. Consultez la console.');
    }
  };

  const menuItems = [
    {
      title: 'Panneau Admin',
      icon: 'shield-checkmark',
      badge: '🔧',
      onPress: () => router.push('/(tabs)/admin' as any),
      admin: true, // Visible uniquement pour l'admin
    },
    {
      title: 'Premium',
      icon: 'diamond-outline',
      badge: '✨',
      onPress: () => router.push('/(tabs)/paywall' as any),
    },
    {
      title: 'Mes réservations',
      icon: 'calendar-outline',
      onPress: () => router.push('/(tabs)/my-bookings' as any),
    },
    {
      title: 'Achievements',
      icon: 'trophy-outline',
      badge: '🏆',
      onPress: () => router.push('/(tabs)/achievements' as any),
    },
    {
      title: 'Informations personnelles',
      icon: 'person-outline',
      onPress: () => Alert.alert('Info', 'Fonctionnalité bientôt disponible'),
    },
    {
      title: 'Mon abonnement',
      icon: 'card-outline',
      badge: 'Gratuit',
      onPress: () => Alert.alert('Abonnement', 'Fonctionnalité bientôt disponible'),
    },
    {
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: () => Alert.alert('Notifications', 'Fonctionnalité bientôt disponible'),
    },
    {
      title: 'Paramètres',
      icon: 'settings-outline',
      onPress: () => Alert.alert('Paramètres', 'Fonctionnalité bientôt disponible'),
    },
    {
      title: 'Aide et support',
      icon: 'help-circle-outline',
      onPress: () => Alert.alert('Aide', 'Contactez-nous à support@sepalis.com'),
    },
    {
      title: 'À propos',
      icon: 'information-circle-outline',
      badge: 'MOF',
      onPress: () => router.push('/(tabs)/about' as any),
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0).toUpperCase()}
            </Text>
          </View>
          {isPremium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="diamond" size={16} color={Colors.dark} />
            </View>
          )}
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {isPremium && (
          <View style={styles.premiumStatus}>
            <Ionicons name="diamond" size={14} color={Colors.accent} />
            <Text style={styles.premiumText}>
              {isTrial ? 'Essai Premium' : 'Premium Actif'}
            </Text>
            {expiresAt && (
              <Text style={styles.expiresText}>
                · Jusqu'au {new Date(expiresAt).toLocaleDateString('fr-FR')}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Plantes</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Tâches</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>0</Text>
          <Text style={styles.statLabel}>Formations</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={styles.menuItem}
            onPress={item.onPress}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIcon}>
                <Ionicons name={item.icon as any} size={24} color={Colors.dark} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
            </View>
            <View style={styles.menuItemRight}>
              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sepalis v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 32,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.white,
  },
  premiumBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.white,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: Colors.mediumGray,
    marginBottom: 8,
  },
  premiumStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  premiumText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  expiresText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    padding: 24,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.border,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.mediumGray,
  },
  menuContainer: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 16,
    color: Colors.dark,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.error,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.error,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
});
