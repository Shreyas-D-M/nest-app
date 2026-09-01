import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function AboutScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <Text variant="caption" color="secondary">About</Text>
        <Text variant="h1">NEST</Text>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="bodyStrong">Finding trusted help for everyday home problems.</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 8 }}>
            NEST helps customers quickly match with local professionals, confirm service details, and manage bookings from one place.
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="bodyStrong">Built for trusted local service</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 8 }}>
            Verified professionals, clear estimates, and helpful guidance from booking through completion.
          </Text>
        </View>

        <Button label="Back to home" onPress={() => router.push('/')} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  card: { borderWidth: 1 },
});
