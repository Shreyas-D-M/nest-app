import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import type { ReactElement } from 'react';

function TabBarIcon({
  name,
  color,
  focused,
}: {
  name: keyof typeof Ionicons.glyphMap;
  color: string;
  focused: boolean;
}): ReactElement {
  return (
    <View style={[styles.iconWrap, { backgroundColor: focused ? '#EEF0FF' : 'transparent' }]}> 
      <Ionicons name={name} size={20} color={color} />
    </View>
  );
}

export default function TabsLayout(): ReactElement {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarStyle: {
          height: 78 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 10),
          borderTopWidth: 1,
          borderTopColor: '#E1E3F0',
          backgroundColor: '#FFFFFF',
          shadowColor: '#4F46E5',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 10,
          elevation: 8,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 56,
          paddingVertical: 0,
        },
        tabBarActiveTintColor: '#4F46E5',
        tabBarInactiveTintColor: '#66667A',
        tabBarIcon: ({ color, focused }) => {
          const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
            index: focused ? 'home' : 'home-outline',
            bookings: focused ? 'calendar' : 'calendar-outline',
            discover: focused ? 'compass' : 'compass-outline',
            messages: focused ? 'chatbubble' : 'chatbubble-outline',
            profile: focused ? 'person' : 'person-outline',
          };

          return <TabBarIcon name={icons[route.name] ?? 'home-outline'} color={color} focused={focused} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="bookings" options={{ title: 'Bookings' }} />
      <Tabs.Screen name="discover" options={{ title: 'Discover' }} />
      <Tabs.Screen name="messages" options={{ title: 'Messages' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
});
