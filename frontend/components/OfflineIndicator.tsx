import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { syncService } from '../services/syncService';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  useEffect(() => {
    // Vérifier l'état initial
    checkOnlineStatus();

    // Écouter les changements de connexion
    const unsubscribe = syncService.subscribeToNetworkChanges((connected) => {
      setIsOnline(connected);
      if (connected) {
        // Synchroniser automatiquement quand on revient en ligne
        syncData();
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const checkOnlineStatus = async () => {
    const online = await syncService.isOnline();
    setIsOnline(online);
    const sync = await syncService.getLastSync();
    setLastSync(sync);
  };

  const syncData = async () => {
    try {
      await syncService.syncAll();
      const sync = await syncService.getLastSync();
      setLastSync(sync);
    } catch (error) {
      console.error('Erreur synchronisation:', error);
    }
  };

  const formatLastSync = () => {
    if (!lastSync) return 'Jamais synchronisé';
    
    const now = new Date();
    const diff = now.getTime() - lastSync.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes === 1) return 'Il y a 1 minute';
    if (minutes < 60) return `Il y a ${minutes} minutes`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return 'Il y a 1 heure';
    if (hours < 24) return `Il y a ${hours} heures`;
    
    return lastSync.toLocaleDateString('fr-FR');
  };

  if (isOnline) {
    return null; // Ne rien afficher si en ligne
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="cloud-offline" size={16} color={Colors.warning} />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode hors ligne</Text>
          <Text style={styles.subtitle}>Dernière sync : {formatLastSync()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.warning + '20',
    borderBottomWidth: 1,
    borderBottomColor: Colors.warning + '50',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.warning,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
