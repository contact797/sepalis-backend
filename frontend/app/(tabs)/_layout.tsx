import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 90,
          paddingBottom: 28,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginBottom: 2,
        },
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
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="zones"
        options={{
          title: 'Mes Zones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="plants"
        options={{
          title: 'Mes Plantes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="leaf" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tâches',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkbox" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="diagnostic"
        options={{
          title: 'Diagnostic',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medical" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="academy"
        options={{
          title: 'Académie',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan-plant"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="add-plant"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="add-task"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="zone-detail"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="plant-detail"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-detail"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
      <Tabs.Screen
        name="course-preregister"
        options={{
          href: null,
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
