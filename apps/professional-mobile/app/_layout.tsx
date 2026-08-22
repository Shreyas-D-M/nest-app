import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useState, type ReactElement } from 'react';
import { ThemeProvider } from '@nest/ui';
import { createQueryClient } from '@/lib/query-client';

/**
 * Root layout: provider composition only, no product navigation.
 *
 * The professional tab bar (Home / Jobs / Earnings / Business) from
 * 03_USER_FLOWS.md is not defined here — tabs pointing at unbuilt screens would
 * imply functionality that does not exist.
 */
export default function RootLayout(): ReactElement {
  // Created once per app instance. Building the client inline would discard the
  // cache on every re-render.
  const [queryClient] = useState(createQueryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false }} />
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
