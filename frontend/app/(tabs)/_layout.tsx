import React, { useState, useEffect } from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomTabBar from '../../components/CustomTabBar';
import OfflineIndicator from '../../components/OfflineIndicator';

export default function TabLayout() {
  const [quizBadge, setQuizBadge] = useState<number | null>(null);

  useEffect(() => {
    checkQuizStatus();
    
    // Recharger toutes les 60 secondes
    const interval = setInterval(checkQuizStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  const checkQuizStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch(`${process.env.EXPO_PUBLIC_BACKEND_URL}/api/quiz/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const stats = await response.json();
        // Afficher le badge "1" si l'utilisateur n'a pas encore répondu aujourd'hui
        setQuizBadge(stats.todayAnswered ? null : 1);
      }
    } catch (error) {
      console.error('Erreur vérification quiz:', error);
    }
  };

  return (
    <>
      <OfflineIndicator />
      <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: Colors.border,
        },
        headerTitleStyle: {
          fontSize: 18,
          fontWeight: 'bold',
          color: Colors.text,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Jardin',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: 'Zones',
          tabBarIcon: ({ color }) => (
            <Ionicons name="grid" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Plantes',
          tabBarIcon: ({ color }) => (
            <Ionicons name="leaf" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: 'Académie',
          tabBarIcon: ({ color }) => (
            <Ionicons name="school" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="quiz"
        options={{
          title: 'Quiz',
          tabBarIcon: ({ color }) => (
            <Ionicons name="help-circle" size={24} color={color} />
          ),
          tabBarBadge: quizBadge,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="diagnostic"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="scan-plant"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="add-plant"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="add-task"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="zone-detail"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="plant-detail"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-detail"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-preregister"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="workshop-detail"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="workshop-booking"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="booking-success"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="edit-zone"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-booking"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-booking-success"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="my-bookings"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="achievements"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="paywall"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="check-compatibility"
        options={{
          tabBarButton: () => null,
        }}
      />
    </Tabs>
    </>
  );
}
