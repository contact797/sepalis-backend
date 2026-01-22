import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Onboarding } from '../components/Onboarding';
import React, { useEffect, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { Ionicons, MaterialIcons, FontAwesome, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { View, ActivityIndicator, Platform } from 'react-native';

// Empêcher le splash screen de se cacher automatiquement
SplashScreen.preventAutoHideAsync();

// Configuration des notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function RootNavigator() {
  const { showOnboarding, completeOnboarding } = useAuth();

  if (showOnboarding) {
    return <Onboarding onComplete={completeOnboarding} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [iconsLoaded, setIconsLoaded] = useState(false);
  
  // Charger les polices d'icônes de manière asynchrone pour le web
  const loadIconFonts = useCallback(async () => {
    try {
      await Promise.all([
        Ionicons.loadFont(),
        MaterialIcons.loadFont(),
        FontAwesome.loadFont(),
        FontAwesome5.loadFont(),
        MaterialCommunityIcons.loadFont(),
      ]);
      setIconsLoaded(true);
    } catch (error) {
      console.warn('Error loading icon fonts:', error);
      // On continue même si le chargement échoue
      setIconsLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadIconFonts();
  }, [loadIconFonts]);

  // Polices personnalisées seulement (pas @expo/vector-icons)
  const [customFontsLoaded] = useFonts({
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const fontsLoaded = customFontsLoaded && iconsLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a2e' }}>
        <ActivityIndicator size="large" color="#22C55E" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <SubscriptionProvider>
          <RootNavigator />
        </SubscriptionProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
