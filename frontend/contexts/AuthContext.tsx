import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authAPI } from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  showOnboarding: boolean;
  completeOnboarding: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    loadStoredData();
  }, []);

  async function loadStoredData() {
    try {
      const storedUser = await AsyncStorage.getItem('user');
      const storedToken = await AsyncStorage.getItem('token');
      const onboardingCompleted = await AsyncStorage.getItem('onboardingCompleted');

      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
        
        // Afficher l'onboarding si pas encore complété
        if (!onboardingCompleted) {
          setShowOnboarding(true);
        }
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
    } finally {
      setLoading(false);
    }
  }
  
  const completeOnboarding = () => {
    setShowOnboarding(false);
  };

  async function signIn(email: string, password: string) {
    try {
      const response = await authAPI.login(email, password);
      const { token, user: userData } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur de connexion');
    }
  }

  async function signUp(email: string, password: string, name: string) {
    try {
      const response = await authAPI.register(email, password, name);
      const { token, user: userData } = response.data;

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Erreur d\'inscription');
    }
  }

  async function signOut() {
    try {
      console.log('🔓 Déconnexion en cours...');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('authToken'); // Support des deux noms
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('onboardingCompleted');
      setUser(null);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, showOnboarding, completeOnboarding, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth doit être utilisé dans AuthProvider');
  }
  return context;
}
