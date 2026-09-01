import { Link, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getServices } from '@/lib/api';

export default function ProfessionalDetailScreen(): ReactElement {
  const theme = useTheme();
  const { service } = useLocalSearchParams<{ service?: string }>();
  const { data } = useQuery({ queryKey: ['catalog'], queryFn: getServices });

  const selectedService =
    (data?.categories ?? []).flatMap((category) => category.services).find((item) => item.name === service) ??
    (data?.categories ?? []).flatMap((category) => category.services)[0];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/professionals" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Professional profile
          </Text>
        </View>

        <View
          style={[
            styles.hero,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="h1">{selectedService?.name ?? 'Service professional'}</Text>
          <Text variant="secondary" color="secondary">
            {selectedService && selectedService.basePriceMinor != null
              ? `From ₹${(selectedService.basePriceMinor / 100).toFixed(0)} · available now`
              : 'Service profile'}
          </Text>
          <View style={styles.metricsRow}>
            <Text>⭐ 4.9</Text>
            <Text>Trust 94</Text>
            <Text>1.6 km away</Text>
          </View>
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
          <Text variant="h2">Why recommended</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Fast response, clear pricing, strong review history and verified identity.
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
          <Text variant="h2">Service menu</Text>
          <View style={styles.list}>
            <Text>
              {selectedService?.name ?? 'Selected service'} — ₹
              {selectedService && selectedService.basePriceMinor != null
                ? (selectedService.basePriceMinor / 100).toFixed(0)
                : '0'}
            </Text>
            <Text>Inspection and diagnosis — ₹299</Text>
            <Text>Minor fix and follow-up — ₹599</Text>
          </View>
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
          <Text variant="h2">Recent reviews</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            “Clear communication and fair pricing. Fixed the issue in one visit.”
          </Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 8 }}>
            — Meera, 2 days ago
          </Text>
        </View>

        <Button
          label="Book this professional"
          onPress={() => router.push(`/booking?service=${encodeURIComponent(selectedService?.name ?? 'service')}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { borderWidth: 1 },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  card: { borderWidth: 1 },
  list: { gap: 8, marginTop: 12 },
});
