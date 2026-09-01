import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listHomeAssets, listHomes } from '@/lib/api';

export default function HomePassportScreen(): ReactElement {
  const theme = useTheme();
  const {
    data: homes,
    isLoading: homesLoading,
    error: homesError,
  } = useQuery({ queryKey: ['homes'], queryFn: listHomes });
  const homeId = homes?.[0]?.id;
  const {
    data: assets,
    isLoading: assetsLoading,
    error: assetsError,
  } = useQuery({
    queryKey: ['home-assets', homeId],
    enabled: !!homeId,
    queryFn: () => listHomeAssets(homeId!),
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
            Home Passport
          </Text>
        </View>

        <Text variant="h1">Maintenance history</Text>

        {homesLoading && (
          <Text variant="secondary" color="secondary">
            Loading homes…
          </Text>
        )}
        {homesError && (
          <Text variant="secondary" color="secondary">
            Unable to load home records right now.
          </Text>
        )}
        {!homesLoading && !homesError && (!homes || homes.length === 0) && (
          <Text variant="secondary" color="secondary">
            No homes are saved yet. Add a home to start tracking assets.
          </Text>
        )}

        <View style={styles.list}>
          {assetsLoading && (
            <Text variant="secondary" color="secondary">
              Loading home assets…
            </Text>
          )}
          {assetsError && (
            <Text variant="secondary" color="secondary">
              Unable to load assets right now.
            </Text>
          )}
          {!assetsLoading &&
            !assetsError &&
            (assets ?? []).map((item) => (
              <View
                key={item.id}
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
                <Text variant="bodyStrong">{item.brand ?? item.assetType}</Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                  {item.model ?? 'Asset record'}
                </Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                  {item.warrantyEnd
                    ? `Warranty ends ${new Date(item.warrantyEnd).toLocaleDateString()}`
                    : 'Warranty not on file'}
                </Text>
              </View>
            ))}
        </View>

        <Button
          label="Add asset"
          onPress={() => router.push('/support')}
          variant="secondary"
        />
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
