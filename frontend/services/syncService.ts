import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { tasksAPI, plantsAPI, zonesAPI } from './api';

const CACHE_KEYS = {
  TASKS: '@sepalis_tasks',
  PLANTS: '@sepalis_plants',
  ZONES: '@sepalis_zones',
  LAST_SYNC: '@sepalis_last_sync',
};

export const syncService = {
  /**
   * Vérifie si l'appareil est connecté
   */
  async isOnline(): Promise<boolean> {
    const state = await NetInfo.fetch();
    return state.isConnected ?? false;
  },

  /**
   * Synchronise toutes les données avec le serveur
   */
  async syncAll(): Promise<void> {
    const isOnline = await this.isOnline();
    
    if (!isOnline) {
      console.log('Hors ligne - synchronisation annulée');
      return;
    }

    try {
      // Récupérer les données du serveur
      const [tasksResponse, plantsResponse, zonesResponse] = await Promise.all([
        tasksAPI.getTasks(),
        plantsAPI.getUserPlants(),
        zonesAPI.getZones(),
      ]);

      // Sauvegarder en local
      await Promise.all([
        AsyncStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(tasksResponse.data)),
        AsyncStorage.setItem(CACHE_KEYS.PLANTS, JSON.stringify(plantsResponse.data)),
        AsyncStorage.setItem(CACHE_KEYS.ZONES, JSON.stringify(zonesResponse.data)),
        AsyncStorage.setItem(CACHE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);

      console.log('✅ Synchronisation complète réussie');
    } catch (error) {
      console.error('❌ Erreur synchronisation:', error);
      throw error;
    }
  },

  /**
   * Récupère les tâches (cache ou serveur)
   */
  async getTasks(): Promise<any[]> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      try {
        const response = await tasksAPI.getTasks();
        await AsyncStorage.setItem(CACHE_KEYS.TASKS, JSON.stringify(response.data));
        return response.data;
      } catch (error) {
        console.log('Erreur serveur, utilisation du cache');
        return await this.getCachedTasks();
      }
    } else {
      return await this.getCachedTasks();
    }
  },

  /**
   * Récupère les plantes (cache ou serveur)
   */
  async getPlants(): Promise<any[]> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      try {
        const response = await plantsAPI.getUserPlants();
        await AsyncStorage.setItem(CACHE_KEYS.PLANTS, JSON.stringify(response.data));
        return response.data;
      } catch (error) {
        console.log('Erreur serveur, utilisation du cache');
        return await this.getCachedPlants();
      }
    } else {
      return await this.getCachedPlants();
    }
  },

  /**
   * Récupère les zones (cache ou serveur)
   */
  async getZones(): Promise<any[]> {
    const isOnline = await this.isOnline();

    if (isOnline) {
      try {
        const response = await zonesAPI.getZones();
        await AsyncStorage.setItem(CACHE_KEYS.ZONES, JSON.stringify(response.data));
        return response.data;
      } catch (error) {
        console.log('Erreur serveur, utilisation du cache');
        return await this.getCachedZones();
      }
    } else {
      return await this.getCachedZones();
    }
  },

  /**
   * Récupère les tâches en cache
   */
  async getCachedTasks(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.TASKS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Erreur lecture cache tasks:', error);
      return [];
    }
  },

  /**
   * Récupère les plantes en cache
   */
  async getCachedPlants(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.PLANTS);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Erreur lecture cache plants:', error);
      return [];
    }
  },

  /**
   * Récupère les zones en cache
   */
  async getCachedZones(): Promise<any[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.ZONES);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Erreur lecture cache zones:', error);
      return [];
    }
  },

  /**
   * Récupère la date de dernière synchronisation
   */
  async getLastSync(): Promise<Date | null> {
    try {
      const lastSync = await AsyncStorage.getItem(CACHE_KEYS.LAST_SYNC);
      return lastSync ? new Date(lastSync) : null;
    } catch (error) {
      console.error('Erreur lecture last sync:', error);
      return null;
    }
  },

  /**
   * Vide le cache
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        CACHE_KEYS.TASKS,
        CACHE_KEYS.PLANTS,
        CACHE_KEYS.ZONES,
        CACHE_KEYS.LAST_SYNC,
      ]);
      console.log('✅ Cache vidé');
    } catch (error) {
      console.error('❌ Erreur vidage cache:', error);
    }
  },

  /**
   * Écoute les changements de connexion
   */
  subscribeToNetworkChanges(callback: (isConnected: boolean) => void): () => void {
    const unsubscribe = NetInfo.addEventListener(state => {
      callback(state.isConnected ?? false);
    });
    
    return unsubscribe;
  },
};
