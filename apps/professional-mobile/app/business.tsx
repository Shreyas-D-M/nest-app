import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { getProfessionalProfile, listProfessionalServices } from '@/lib/api';

export default function BusinessScreen(): ReactElement {
  const theme = useTheme();
  const {
    data: profile,
    isLoading,
    error,
  } = useQuery({ queryKey: ['professional-profile'], queryFn: getProfessionalProfile });
  const { data: services } = useQuery({
    queryKey: ['professional-services'],
    queryFn: listProfessionalServices,
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
            Business
          </Text>
        </View>

        <Text variant="h1">My storefront</Text>

        {isLoading && (
          <Text variant="secondary" color="secondary">
            Loading business profile…
          </Text>
        )}
        {error && (
          <Text variant="secondary" color="secondary">
            Unable to load business profile right now.
          </Text>
        )}

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
          <Text variant="h2">Services</Text>
          <View style={styles.list}>
            {(services ?? []).map((service) => (
              <View key={service.serviceId} style={styles.row}>
                <Text>{service.serviceName}</Text>
                <Text>{`₹${(service.basePriceMinor / 100).toFixed(0)}`}</Text>
              </View>
            ))}
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
          <Text variant="h2">Profile</Text>
          <View style={styles.list}>
            <Text variant="secondary" color="secondary">
              {profile?.businessName ?? 'Business name unavailable'}
            </Text>
            <Text variant="secondary" color="secondary">
              {profile?.bio ?? 'Add a short bio for your storefront.'}
            </Text>
            <Text variant="secondary" color="secondary">
              Status: {profile?.verificationStatus ?? 'UNKNOWN'}
            </Text>
          </View>
        </View>

        <Button label="Update profile" onPress={() => undefined} variant="secondary" />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
  list: { gap: 8, marginTop: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
