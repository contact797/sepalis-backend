import { Stack } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { SubscriptionProvider } from '../contexts/SubscriptionContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Onboarding } from '../components/Onboarding';
import React, { useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

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
  // Charger les polices d'icônes depuis assets/fonts pour le web
  const [fontsLoaded] = useFonts({
    'Ionicons': require('../assets/fonts/Ionicons.ttf'),
    'Material Icons': require('../assets/fonts/MaterialIcons.ttf'),
    'MaterialIcons': require('../assets/fonts/MaterialIcons.ttf'),
    'FontAwesome': require('../assets/fonts/FontAwesome.ttf'),
    'FontAwesome5_Regular': require('../assets/fonts/FontAwesome5_Regular.ttf'),
    'FontAwesome5_Solid': require('../assets/fonts/FontAwesome5_Solid.ttf'),
    'FontAwesome5_Brands': require('../assets/fonts/FontAwesome5_Brands.ttf'),
    'Material Design Icons': require('../assets/fonts/MaterialCommunityIcons.ttf'),
    'MaterialCommunityIcons': require('../assets/fonts/MaterialCommunityIcons.ttf'),
    'SpaceMono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

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
