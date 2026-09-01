import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listProfessionalJobs } from '@/lib/api';

export default function JobsScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['professional-jobs'],
    queryFn: listProfessionalJobs,
  });

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
            Job queue
          </Text>
        </View>

        <Text variant="h1">Open jobs</Text>

        <View style={styles.list}>
          {isLoading && (
            <Text variant="secondary" color="secondary">
              Loading job queue…
            </Text>
          )}
          {error && (
            <Text variant="secondary" color="secondary">
              Unable to load jobs right now.
            </Text>
          )}
          {!isLoading && !error && (data?.data ?? []).length === 0 && (
            <Text variant="secondary" color="secondary">
              No open jobs right now. Try refreshing later.
            </Text>
          )}
          {(data?.data ?? []).map((job) => (
            <View
              key={job.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                },
              ]}
            >
              <View style={styles.row}>
                <Text variant="bodyStrong">{job.customer.name ?? 'Customer'}</Text>
                <View
                  style={[
                    styles.priority,
                    {
                      backgroundColor:
                        job.status === 'REQUESTED'
                          ? theme.colors.warning
                          : theme.colors.surfaceMuted,
                    },
                  ]}
                >
                  <Text
                    variant="secondary"
                    color={job.status === 'REQUESTED' ? 'warning' : 'primary'}
                  >
                    {job.status}
                  </Text>
                </View>
              </View>

              <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                {job.service.name}
              </Text>
              <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                {job.address.addressLine}
              </Text>
              <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                {new Date(job.scheduledStart).toLocaleString()}
              </Text>

              <View style={{ marginTop: 12 }}>
                <Button label="View details" onPress={() => undefined} variant="secondary" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  list: { gap: 12 },
  card: { borderWidth: 1 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priority: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
});
