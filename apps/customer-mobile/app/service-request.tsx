import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function ServiceRequestScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/" asChild>
            <Text variant="secondary" color="accent">
              ← Home
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            New request
          </Text>
        </View>

        <Text variant="h1">Service request</Text>

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
          <Text variant="h2">Issue summary</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Kitchen tap leakage and reduced sink pressure.
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
          <Text variant="h2">Service area</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Sadashiv Nagar · 3rd Cross, Belagavi
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
          <Text variant="h2">Priority</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            High urgency · plumber needed today
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Continue to matching" onPress={() => router.push('/problem-assistant')} />
          <Button label="Save draft" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
});
