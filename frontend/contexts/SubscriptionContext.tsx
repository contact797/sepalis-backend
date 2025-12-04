import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionAPI } from '../services/api';
import { subscriptionService } from '../services/subscriptionService';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isPremium: boolean;
  isTrial: boolean;
  isLoading: boolean;
  expiresAt: Date | null;
  daysRemaining: number | null;
  isExpired: boolean;
  checkSubscription: () => Promise<void>;
  startTrial: () => Promise<boolean>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isPremium, setIsPremium] = useState(false);
  const [isTrial, setIsTrial] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (user) {
      initializeSubscription();
    }
  }, [user]);

  const initializeSubscription = async () => {
    try {
      // Vérifier le statut de l'abonnement
      await checkSubscription();
    } catch (error) {
      console.error('Erreur initialisation abonnement:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkSubscription = async () => {
    try {
      setIsLoading(true);
      
      // Vérifier depuis le backend
      const response = await subscriptionAPI.getStatus();
      const status = response.data;

      setIsPremium(status.isActive);
      setIsTrial(status.isTrial);
      setExpiresAt(status.expiresAt ? new Date(status.expiresAt) : null);

      console.log('✅ Statut abonnement:', status);

    } catch (error) {
      console.error('Erreur vérification abonnement:', error);
      // En cas d'erreur, on donne accès (meilleure UX en mode démo)
      setIsPremium(true);
    } finally {
      setIsLoading(false);
    }
  };

  const startTrial = async (): Promise<boolean> => {
    try {
      const response = await subscriptionAPI.startTrial();
      
      if (response.data.success) {
        setIsPremium(true);
        setIsTrial(true);
        setExpiresAt(new Date(response.data.expiresAt));
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Erreur démarrage essai:', error);
      return false;
    }
  };

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isTrial,
        isLoading,
        expiresAt,
        checkSubscription,
        startTrial,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
}
