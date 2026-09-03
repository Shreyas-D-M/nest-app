import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { listNotifications } from '@/lib/api';
import { EmptyState, Header, LoadingSkeleton } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function NotificationsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: listNotifications,
  });

  const notifications = data?.notifications ?? [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Header
          caption="Updates & Alerts"
          title="Notifications"
          subtitle="Real-time alerts regarding technician en route status, booking receipts, and offers."
        />

        {/* Notifications List */}
        <View style={styles.list}>
          {isLoading && <LoadingSkeleton height={80} count={3} />}

          {error && (
            <View style={styles.errorBox}>
              <Text variant="bodyStrong">Unable to load notifications</Text>
              <Button label="Retry" variant="secondary" onPress={() => void refetch()} />
            </View>
          )}

          {!isLoading && !error && notifications.length === 0 && (
            <EmptyState
              icon="notifications-off-outline"
              title="No notifications right now"
              subtitle="When you book a service or your specialist is en route, you'll receive live alerts here."
            />
          )}

          {notifications.map((item) => (
            <View
              key={item.id}
              style={[
                styles.card,
                !item.readAt && styles.cardUnread,
              ]}
            >
              <View style={styles.cardHeader}>
                <View style={[styles.iconWrap, { backgroundColor: item.readAt ? colors.surfaceMuted : colors.primaryLight }]}>
                  <Ionicons
                    name="notifications"
                    size={16}
                    color={item.readAt ? colors.textSecondary : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" style={styles.itemTitle}>
                    {item.title}
                  </Text>
                  <Text variant="secondary" color="secondary" style={styles.itemBody}>
                    {item.body}
                  </Text>
                </View>
                {!item.readAt ? <View style={styles.unreadDot} /> : null}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
    paddingBottom: 110,
  },
  list: {
    gap: spacing.sm,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardUnread: {
    borderColor: colors.primaryBorder,
    backgroundColor: colors.surfaceSubtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
    color: colors.textSecondary,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginTop: 4,
  },
  errorBox: {
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
});
