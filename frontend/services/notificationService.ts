import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configuration du comportement des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const notificationService = {
  /**
   * Demande la permission d'envoyer des notifications
   */
  async requestPermissions(): Promise<boolean> {
    if (!Device.isDevice) {
      console.log('Les notifications ne fonctionnent que sur un appareil physique');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission de notification refusée');
      return false;
    }

    return true;
  },

  /**
   * Obtient le token push de l'appareil
   */
  async getExpoPushToken(): Promise<string | null> {
    try {
      if (!Device.isDevice) {
        console.log('Les push tokens ne fonctionnent que sur un appareil physique');
        return null;
      }

      const projectId = Constants.expoConfig?.extra?.eas?.projectId || 'default-project';
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId,
      });

      console.log('Push token:', token.data);
      return token.data;
    } catch (error) {
      console.error('Erreur obtention push token:', error);
      return null;
    }
  },

  /**
   * Programme une notification locale
   */
  async scheduleNotification(
    title: string,
    body: string,
    trigger: Date | number,
    data?: any
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger:
        typeof trigger === 'number'
          ? { seconds: trigger }
          : trigger,
    });

    return notificationId;
  },

  /**
   * Programme une notification locale immédiate
   */
  async sendImmediateNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Immédiat
    });

    return notificationId;
  },

  /**
   * Annule une notification programmée
   */
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  },

  /**
   * Annule toutes les notifications programmées
   */
  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  },

  /**
   * Obtient toutes les notifications programmées
   */
  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  },

  /**
   * Définit le badge de l'icône de l'app
   */
  async setBadgeCount(count: number): Promise<void> {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  },

  /**
   * Obtient le nombre de badges
   */
  async getBadgeCount(): Promise<number> {
    if (Platform.OS === 'ios') {
      return await Notifications.getBadgeCountAsync();
    }
    return 0;
  },

  /**
   * Programme des rappels pour les tâches du jour
   */
  async scheduleDailyTaskReminder(tasks: any[]): Promise<void> {
    // Annuler les anciennes notifications de tâches
    const scheduled = await this.getScheduledNotifications();
    for (const notif of scheduled) {
      if (notif.content.data?.type === 'task-reminder') {
        await this.cancelNotification(notif.identifier);
      }
    }

    // Programmer une notification pour chaque tâche due aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const task of tasks) {
      if (!task.completed && task.dueDate) {
        const dueDate = new Date(task.dueDate);
        dueDate.setHours(0, 0, 0, 0);

        // Si la tâche est due aujourd'hui
        if (dueDate.getTime() === today.getTime()) {
          // Programmer une notification à 9h si on n'y est pas encore
          const notificationTime = new Date();
          notificationTime.setHours(9, 0, 0, 0);

          if (notificationTime > new Date()) {
            await this.scheduleNotification(
              '🌱 Tâche de jardinage',
              `N'oubliez pas : ${task.title}`,
              notificationTime,
              { type: 'task-reminder', taskId: task.id }
            );
          }
        }
      }
    }
  },

  /**
   * Programme une notification pour une alerte météo
   */
  async scheduleWeatherAlert(alert: string): Promise<void> {
    await this.sendImmediateNotification(
      '🌤️ Alerte météo',
      alert,
      { type: 'weather-alert' }
    );
  },
};
