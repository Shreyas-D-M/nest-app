import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function ExtraWorkScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/active-booking" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Approval required
          </Text>
        </View>

        <Text variant="h1">Extra work request</Text>

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
          <Text variant="h2">Reason</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            The mixer cartridge is worn and needs replacement to prevent a future leak.
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
          <Text variant="h2">Amount</Text>
          <Text variant="bodyStrong" style={{ marginTop: 8 }}>
            ₹480
          </Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Includes spare cartridge and labour.
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Approve and continue" onPress={() => router.push('/payment')} />
          <Button label="Reject" variant="secondary" onPress={() => router.back()} />
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
