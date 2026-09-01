import { Alert } from 'react-native';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listSupportTickets } from '@/lib/api';

export default function SupportScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['support-tickets'],
    queryFn: listSupportTickets,
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
            Help & support
          </Text>
        </View>

        <Text variant="h1">Need assistance?</Text>

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
          <Text variant="h2">Recent tickets</Text>
          <View style={styles.topicList}>
            {isLoading && (
              <Text variant="secondary" color="secondary">
                Loading support tickets…
              </Text>
            )}
            {error && (
              <Text variant="secondary" color="secondary">
                Unable to load support tickets right now.
              </Text>
            )}
            {!isLoading && !error && (data?.data ?? []).length === 0 && (
              <Text variant="secondary" color="secondary">
                No active support tickets. Contact support if you need help.
              </Text>
            )}
            {(data?.data ?? []).map((ticket) => (
              <View
                key={ticket.id}
                style={[styles.topic, { backgroundColor: theme.colors.surfaceMuted }]}
              >
                <Text variant="secondary" color="primary">
                  {ticket.subject}
                </Text>
                <Text variant="secondary" color="secondary" style={{ marginTop: 4 }}>
                  {ticket.status} · {ticket.priority}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Button
          label="Contact support"
          onPress={() =>
            Alert.alert('Support request received', 'A NEST support specialist will reach out shortly.', [{ text: 'OK' }])
          }
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  card: { borderWidth: 1 },
  topicList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  topic: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
