import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarScrollEnabled: false,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          height: 90,
          paddingBottom: 28,
          paddingTop: 8,
          paddingLeft: 0,
          paddingRight: 0,
        },
        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
          paddingHorizontal: 0,
        },
        tabBarLabelStyle: {
          fontSize: 8,
          fontWeight: '600',
          marginTop: 1,
        },
        tabBarIconStyle: {
          marginBottom: 0,
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
          title: 'Cours',
          tabBarIcon: ({ color }) => (
            <Ionicons name="school" size={24} color={color} />
          ),
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
    </Tabs>
  );
}
