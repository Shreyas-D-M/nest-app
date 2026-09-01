import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function BookingConfirmationScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View
          style={[
            styles.successCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="h1">Booking confirmed</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Your tap repair with Asha K. is booked for today at 6:00 PM.
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
          <Text variant="h2">Booking ID</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            NEST-2041
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
          <Text variant="h2">Professional</Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Asha K. · NEST Home Care
          </Text>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Track booking" onPress={() => router.push('/active-booking')} />
          <Button label="Back to home" variant="secondary" onPress={() => router.push('/')} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  successCard: { borderWidth: 1 },
  card: { borderWidth: 1 },
});
