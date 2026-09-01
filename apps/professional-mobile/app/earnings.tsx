import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listProfessionalJobs } from '@/lib/api';

export default function EarningsScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['professional-jobs'],
    queryFn: listProfessionalJobs,
  });

  const jobs = data?.data ?? [];
  const revenueMinor = jobs.reduce(
    (sum, job) => sum + (job.finalAmountMinor ?? job.estimatedAmountMinor),
    0,
  );
  const paid = jobs.filter((job) => job.status === 'PAID' || job.status === 'COMPLETED').length;

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
            Earnings
          </Text>
        </View>

        <Text variant="h1">Summary</Text>

        {isLoading && (
          <Text variant="secondary" color="secondary">
            Loading earnings…
          </Text>
        )}
        {error && (
          <Text variant="secondary" color="secondary">
            Unable to load earnings right now.
          </Text>
        )}

        <View style={styles.metricsRow}>
          <View
            style={[
              styles.metric,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text variant="secondary" color="secondary">
              Gross
            </Text>
            <Text
              variant="h2"
              style={{ marginTop: 8 }}
            >{`₹${(revenueMinor / 100).toFixed(0)}`}</Text>
          </View>
          <View
            style={[
              styles.metric,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
                padding: theme.spacing.md,
              },
            ]}
          >
            <Text variant="secondary" color="secondary">
              Completed
            </Text>
            <Text variant="h2" style={{ marginTop: 8 }}>
              {paid}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metricsRow: { gap: 12 },
  metric: { borderWidth: 1 },
});
