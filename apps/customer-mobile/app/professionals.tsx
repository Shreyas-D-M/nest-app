import { Link, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getServices } from '@/lib/api';

export default function ProfessionalsScreen(): ReactElement {
  const theme = useTheme();
  const { category, issue } = useLocalSearchParams<{ category?: string; issue?: string }>();
  const { data, isLoading, error } = useQuery({ queryKey: ['catalog'], queryFn: getServices });

  const serviceMatches = useMemo(() => {
    const categoryFilter = String(category ?? '').trim().toLowerCase();
    const issueFilter = String(issue ?? '').trim().toLowerCase();

    const matches = (data?.categories ?? []).flatMap((catalogCategory) =>
      catalogCategory.services.map((service) => ({
        id: service.id,
        name: service.name,
        category: catalogCategory.name,
        price: service.basePriceMinor,
      })),
    );

    if (!categoryFilter && !issueFilter) {
      return matches.slice(0, 6);
    }

    return matches.filter((service) => {
      const serviceText = `${service.name} ${service.category}`.toLowerCase();
      if (categoryFilter && serviceText.includes(categoryFilter)) {
        return true;
      }
      if (issueFilter) {
        return serviceText.includes(issueFilter.split(' ')[0] ?? '') || serviceText.includes('repair') || serviceText.includes('service');
      }
      return true;
    }).slice(0, 6);
  }, [category, data, issue]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 120 }}>
        <View style={styles.topRow}>
          <Link href="/problem-assistant" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Recommended professionals
          </Text>
        </View>

        <Text variant="h1">Service matches</Text>
        {category ? (
          <Text variant="secondary" color="secondary">
            Best match: {category}
          </Text>
        ) : null}

        <View style={styles.filterRow}>
          <Text variant="secondary" color="secondary">
            Recommended
          </Text>
          <Text variant="secondary" color="secondary">
            Fastest
          </Text>
          <Text variant="secondary" color="secondary">
            Cheapest
          </Text>
        </View>

        {isLoading && (
          <Text variant="secondary" color="secondary">
            Loading service matches…
          </Text>
        )}
        {error && (
          <Text variant="secondary" color="secondary">
            Unable to load matching services right now.
          </Text>
        )}

        <View style={styles.list}>
          {!isLoading && !error && serviceMatches.length === 0 && (
            <Text variant="secondary" color="secondary">
              No matching services are available right now.
            </Text>
          )}
          {(serviceMatches ?? []).map((service) => (
            <View
              key={service.id}
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
              <View style={styles.cardHeader}>
                <View>
                  <Text variant="bodyStrong">{service.name}</Text>
                  <Text variant="secondary" color="secondary">
                    {service.category}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: theme.colors.surfaceMuted }]}>
                  <Text variant="secondary" color="accent">
                    Recommended
                  </Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Text variant="secondary" color="secondary">
                  {service.price != null ? `From ₹${(service.price / 100).toFixed(0)}` : 'Estimate available'}
                </Text>
                <Text variant="secondary" color="secondary">
                  Available now
                </Text>
              </View>

              <Button
                label="View profile"
                variant="secondary"
                onPress={() => router.push(`/professional-detail?service=${encodeURIComponent(service.name)}`)}
              />
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
  filterRow: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  list: { gap: 12 },
  card: { borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  tag: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 6 },
});
