import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getServices } from '@/lib/api';

export default function DiscoverScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({ queryKey: ['catalog'], queryFn: getServices });

  const categories = data?.categories ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg, paddingBottom: 140 }}>
        <View style={styles.topRow}>
          <Text variant="caption" color="secondary">
            Discover
          </Text>
        </View>

        <Text variant="h1">Find the right help</Text>

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
          <Text variant="bodyStrong">Need a trusted local expert fast?</Text>
          <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
            Browse by service, urgency, and local availability before you book.
          </Text>
          <View style={{ marginTop: theme.spacing.md }}>
            <Button label="Browse professionals" onPress={() => router.push('/professionals')} />
          </View>
        </View>

        <View>
          <Text variant="h2" style={{ marginBottom: 12 }}>
            Popular categories
          </Text>

          {isLoading && (
            <Text variant="secondary" color="secondary">
              Loading service categories…
            </Text>
          )}
          {error && (
            <Text variant="secondary" color="secondary">
              Unable to load service categories right now.
            </Text>
          )}

          <View style={styles.grid}>
            {!isLoading && !error && categories.map((category) => (
              <Pressable
                key={category.id}
                onPress={() => router.push({ pathname: '/professionals', params: { category: category.name } })}
                style={[
                  styles.categoryCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                  },
                ]}
              >
                <Text variant="bodyStrong">{category.name}</Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                  {category.services.length} services available
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View>
          <Text variant="h2" style={{ marginBottom: 12 }}>
            Quick actions
          </Text>
          <View style={styles.actions}>
            <Button label="Book now" onPress={() => router.push('/create')} variant="secondary" />
            <Button label="View favorites" onPress={() => router.push('/favorites')} variant="secondary" />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hero: { borderWidth: 1 },
  grid: { gap: 12 },
  categoryCard: { borderWidth: 1 },
  actions: { gap: 12 },
});
