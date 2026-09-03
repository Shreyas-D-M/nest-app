import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect, useState, type ReactElement } from 'react';
import { router, useSegments } from 'expo-router';
import { ThemeProvider } from '@nest/ui';
import { createQueryClient } from '@/lib/query-client';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { AddressProvider } from '@/lib/address-context';

export default function RootLayout(): ReactElement {
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider onSignOut={() => queryClient.clear()}>
        <AddressProvider>
          <SafeAreaProvider>
            <ThemeProvider>
              <AuthNavigator />
            </ThemeProvider>
          </SafeAreaProvider>
        </AddressProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

function AuthNavigator(): ReactElement {
  const { isReady, session } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (!isReady) return;
    const onSignIn = segments[0] === 'sign-in';
    if (!session && !onSignIn) router.replace('/sign-in');
    if (session && onSignIn) router.replace('/(tabs)');
  }, [isReady, segments, session]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="sign-in" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="create" />
        <Stack.Screen name="problem-assistant" />
        <Stack.Screen name="professionals" />
        <Stack.Screen name="professional-detail" />
        <Stack.Screen name="booking" />
        <Stack.Screen name="booking-confirmation" />
        <Stack.Screen name="active-booking" />
        <Stack.Screen name="service-request" />
        <Stack.Screen name="payment" />
        <Stack.Screen name="invoice" />
        <Stack.Screen name="review" />
        <Stack.Screen name="favorites" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="addresses" />
        <Stack.Screen name="home-passport" />
        <Stack.Screen name="support" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="about" />
        <Stack.Screen name="menu" />
      </Stack>
    </>
  );
}
