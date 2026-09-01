import { Link, router, useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function BookingScreen(): ReactElement {
  const theme = useTheme();
  const { service } = useLocalSearchParams<{ service?: string }>();
  const selectedServiceName = service ?? 'Tap repair';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/professional-detail" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Booking details
          </Text>
        </View>

        <Text variant="h1">Book service</Text>

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
          <Text variant="h2">Service</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            {selectedServiceName}
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
          <Text variant="h2">Schedule</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Today · 6:00 PM to 6:45 PM
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
          <Text variant="h2">Address</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            B-204, 3rd Cross, Sadashiv Nagar, Belagavi
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
          <Text variant="h2">Price estimate</Text>
          <Text variant="bodyStrong" style={{ marginTop: 8 }}>
            ₹499 service fee
          </Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Includes inspection and standard tap repair.
          </Text>
        </View>

        <Button
          label="Confirm booking"
          onPress={() => router.push(`/booking-confirmation?service=${encodeURIComponent(selectedServiceName)}`)}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
});
