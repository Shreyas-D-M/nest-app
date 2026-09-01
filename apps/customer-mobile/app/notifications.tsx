import { Link } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, useTheme } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listNotifications } from '@/lib/api';

export default function NotificationsScreen(): ReactElement {
  const theme = useTheme();
  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
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
            Notifications
          </Text>
        </View>

        <Text variant="h1">Inbox</Text>

        <View style={styles.list}>
          {isLoading && (
            <Text variant="secondary" color="secondary">
              Loading inbox…
            </Text>
          )}
          {error && (
            <Text variant="secondary" color="secondary">
              Unable to load notifications right now.
            </Text>
          )}
          {!isLoading && !error && (data?.notifications ?? []).length === 0 && (
            <Text variant="secondary" color="secondary">
              You have no new notifications yet.
            </Text>
          )}
          {(data?.notifications ?? []).map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: item.readAt ? theme.colors.border : theme.colors.accent,
                  borderRadius: theme.radius.md,
                  padding: theme.spacing.md,
                },
              ]}
            >
              <Text variant="bodyStrong">{item.title}</Text>
              <Text variant="secondary" color="secondary" style={{ marginTop: 6 }}>
                {item.body}
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
});
