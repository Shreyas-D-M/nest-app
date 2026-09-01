import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listCustomerBookings } from '@/lib/api';

export default function BookingsScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: listCustomerBookings,
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
            Booking history
          </Text>
        </View>

        <Text variant="h1">Your bookings</Text>

        <View style={styles.list}>
          {isLoading && (
            <Text variant="secondary" color="secondary">
              Loading bookings…
            </Text>
          )}
          {error && (
            <Text variant="secondary" color="secondary">
              Unable to load bookings right now.
            </Text>
          )}
          {!isLoading && !error && (data?.data ?? []).length === 0 && (
            <Text variant="secondary" color="secondary">
              No bookings yet. Your upcoming and past jobs will show up here.
            </Text>
          )}
          {(data?.data ?? []).map((booking) => (
            <View
              key={booking.id}
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
              <View style={styles.cardRow}>
                <Text variant="bodyStrong">{booking.service.name}</Text>
                <Text variant="secondary" color="secondary">
                  {booking.status}
                </Text>
              </View>
              <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                {new Date(booking.scheduledStart).toLocaleDateString()}
              </Text>
              <Text variant="bodyStrong" style={{ marginTop: 8 }}>
                {booking.finalAmountMinor != null
                  ? `₹${(booking.finalAmountMinor / 100).toFixed(0)}`
                  : `₹${(booking.estimatedAmountMinor / 100).toFixed(0)}`}
              </Text>
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
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
