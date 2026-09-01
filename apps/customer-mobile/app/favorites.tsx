import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listFavorites } from '@/lib/api';

export default function FavoritesScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({ queryKey: ['favorites'], queryFn: listFavorites });

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
            Your People
          </Text>
        </View>

        <Text variant="h1">Trusted professionals</Text>

        <View style={styles.list}>
          {isLoading && (
            <Text variant="secondary" color="secondary">
              Loading your favorite professionals…
            </Text>
          )}
          {error && (
            <Text variant="secondary" color="secondary">
              Unable to load favorites right now.
            </Text>
          )}
          {!isLoading && !error && (data ?? []).length === 0 && (
            <Text variant="secondary" color="secondary">
              No favorites yet. Save trusted professionals from their profiles.
            </Text>
          )}
          {(data ?? []).map((person) => (
            <View
              key={person.id}
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
              <Text variant="bodyStrong">{person.professional.businessName}</Text>
              <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                {person.professional.bio ?? 'Trusted professional'}
              </Text>
              <View style={{ marginTop: 12 }}>
                <Button
                  label="Book again"
                  onPress={() => router.push(`/booking?service=${encodeURIComponent(person.professional.businessName)}`)}
                  variant="secondary"
                />
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
});
