import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, type ReactElement } from 'react';
import { ThemeProvider } from '@nest/ui';
import { createQueryClient } from '@/lib/query-client';

export default function RootLayout(): ReactElement {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <Tabs
            screenOptions={{
              headerShown: false,
              tabBarActiveTintColor: '#123B32',
              tabBarInactiveTintColor: '#65716C',
            }}
          >
            <Tabs.Screen name="index" options={{ title: 'Home' }} />
            <Tabs.Screen name="jobs" options={{ title: 'Jobs' }} />
            <Tabs.Screen name="earnings" options={{ title: 'Earnings' }} />
            <Tabs.Screen name="business" options={{ title: 'Business' }} />
          </Tabs>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
