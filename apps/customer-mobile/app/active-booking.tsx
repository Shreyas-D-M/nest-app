import { Alert } from 'react-native';
import { Link, router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import type { ReactElement } from 'react';

export default function ActiveBookingScreen(): ReactElement {
  const theme = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={{ padding: theme.spacing.xl, gap: theme.spacing.lg }}>
        <View style={styles.topRow}>
          <Link href="/booking-confirmation" asChild>
            <Text variant="secondary" color="accent">
              ← Back
            </Text>
          </Link>
          <Text variant="caption" color="secondary">
            Active booking
          </Text>
        </View>

        <Text variant="h1">Track the job</Text>

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
          <Text variant="h2">Status</Text>
          <Text variant="bodyStrong" style={{ marginTop: 8 }}>
            On the way to your home
          </Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            ETA: 14 minutes
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
            Asha K. · 4.9 rating
          </Text>
          <Text color="secondary" style={{ marginTop: 8 }}>
            Call · Chat · Directions
          </Text>
        </View>

        <View
          style={[
            styles.timeline,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text variant="h2">Timeline</Text>
          <View style={styles.timelineItem}>
            <Text>• Booking confirmed</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text>• Professional accepted</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text>• En route</Text>
          </View>
          <View style={styles.timelineItem}>
            <Text>• Job in progress</Text>
          </View>
        </View>

        <View style={{ gap: theme.spacing.sm }}>
          <Button label="Approve extra work" onPress={() => router.push('/extra-work')} />
          <Button
            label="Chat with pro"
            variant="secondary"
            onPress={() =>
              Alert.alert('Chat unavailable', 'The in-app chat is not enabled in this build yet. Please use the call option instead.', [
                { text: 'OK' },
              ])
            }
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
  timeline: { borderWidth: 1 },
  timelineItem: { marginTop: 8 },
});
