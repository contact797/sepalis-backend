import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { isPremium, isTrial, expiresAt } = useSubscription();
  const router = useRouter();
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [registeringNotifications, setRegisteringNotifications] = useState(false);

  // Vérifier le statut des notifications au chargement
  useEffect(() => {
    checkNotificationStatus();
  }, []);

  const checkNotificationStatus = async () => {
    try {
      // Vérifier si l'utilisateur a un token enregistré
      const token = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/user/notification-status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setNotificationsEnabled(data.hasToken);
      } else {
        // Sinon, vérifier les permissions locales
        const { status } = await Notifications.getPermissionsAsync();
        setNotificationsEnabled(status === 'granted');
      }
    } catch (error) {
      console.log('Erreur vérification notifications:', error);
    }
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      // Activer les notifications
      await enableNotifications();
    } else {
      // Désactiver les notifications
      await disableNotifications();
    }
  };

  const enableNotifications = async () => {
    try {
      setRegisteringNotifications(true);
      
      // Vérifier si on est sur un vrai device
      if (!Device.isDevice) {
        Alert.alert(
          'Appareil requis',
          'Les notifications push nécessitent un appareil mobile réel (pas le simulateur).'
        );
        return;
      }

      // Demander la permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission refusée',
          'Veuillez activer les notifications dans les paramètres de votre appareil.'
        );
        return;
      }

      // Obtenir le push token
      const tokenData = await Notifications.getExpoPushTokenAsync();
      const pushToken = tokenData.data;

      // Enregistrer le token sur le serveur
      const authToken = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/register-push-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: pushToken }),
      });

      if (response.ok) {
        setNotificationsEnabled(true);
        Alert.alert(
          '✅ Notifications activées',
          'Vous recevrez maintenant les messages et conseils de Sepalis.'
        );
      } else {
        const errorText = await response.text();
        console.error('Erreur enregistrement token:', errorText);
        Alert.alert('Erreur', 'Impossible d\'activer les notifications');
      }

    } catch (error: any) {
      console.error('Erreur activation notifications:', error);
      Alert.alert('Erreur', `Impossible d'activer les notifications: ${error.message}`);
    } finally {
      setRegisteringNotifications(false);
    }
  };

  const disableNotifications = async () => {
    try {
      setRegisteringNotifications(true);
      
      const authToken = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/unregister-push-token`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setNotificationsEnabled(false);
        Alert.alert(
          'Notifications désactivées',
          'Vous ne recevrez plus de notifications de Sepalis.'
        );
      } else {
        Alert.alert('Erreur', 'Impossible de désactiver les notifications');
      }

    } catch (error: any) {
      console.error('Erreur désactivation notifications:', error);
      Alert.alert('Erreur', `Impossible de désactiver les notifications: ${error.message}`);
    } finally {
      setRegisteringNotifications(false);
    }
  };

  const handleOpenURL = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erreur', `Impossible d'ouvrir le lien : ${title}`);
      }
    } catch (error) {
      console.error('Erreur ouverture URL:', error);
      Alert.alert('Erreur', 'Une erreur est survenue lors de l\'ouverture du lien.');
    }
  };

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

      {/* Section Informations légales */}
      <View style={styles.legalSection}>
        <Text style={styles.sectionTitle}>Informations légales</Text>
        
        <TouchableOpacity
          style={styles.legalItem}
          onPress={() => handleOpenURL('https://contact797.github.io/sepalis-legal/politique%20de%20confidentialit%C3%A9', 'Politique de confidentialité')}
        >
          <View style={styles.legalItemLeft}>
            <View style={styles.legalIcon}>
              <Ionicons name="shield-checkmark-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.legalItemText}>Politique de confidentialité</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={Colors.mediumGray} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.legalItem}
          onPress={() => handleOpenURL('https://contact797.github.io/sepalis-legal/cgu', 'Conditions d\'utilisation')}
        >
          <View style={styles.legalItemLeft}>
            <View style={styles.legalIcon}>
              <Ionicons name="document-text-outline" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.legalItemText}>Conditions d'utilisation</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={Colors.mediumGray} />
        </TouchableOpacity>

        <View style={styles.legalInfo}>
          <Ionicons name="business-outline" size={16} color={Colors.mediumGray} />
          <Text style={styles.legalInfoText}>SEPALIS - Deauville, France</Text>
        </View>
        <View style={styles.legalInfo}>
          <Ionicons name="document-outline" size={16} color={Colors.mediumGray} />
          <Text style={styles.legalInfoText}>SIRET: 478 499 767 00067</Text>
        </View>
        <View style={styles.legalInfo}>
          <Ionicons name="call-outline" size={16} color={Colors.mediumGray} />
          <Text style={styles.legalInfoText}>06 40 39 71 38</Text>
        </View>
        <View style={styles.legalInfo}>
          <Ionicons name="mail-outline" size={16} color={Colors.mediumGray} />
          <Text style={styles.legalInfoText}>contact@sepalis.com</Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={24} color={Colors.error} />
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Sepalis v1.0.0</Text>
        <Text style={styles.footerSubtext}>Validé par un MOF Paysagiste 🏆</Text>
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
  legalSection: {
    backgroundColor: Colors.white,
    marginTop: 16,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark,
    marginBottom: 16,
  },
  legalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  legalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  legalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  legalItemText: {
    fontSize: 15,
    color: Colors.dark,
    fontWeight: '500',
  },
  legalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingTop: 12,
  },
  legalInfoText: {
    fontSize: 13,
    color: Colors.mediumGray,
  },
  footer: {
    padding: 32,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 11,
    color: Colors.mediumGray,
    fontStyle: 'italic',
  },
});
