import { router } from 'expo-router';
import { useMemo, useState, type ReactElement } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useQuery } from '@tanstack/react-query';
import { listCustomerBookings } from '@/lib/api';
import { BookingCard, EmptyState, LoadingSkeleton } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

export default function BookingsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['customer-bookings'],
    queryFn: listCustomerBookings,
  });

  const [activeTab, setActiveTab] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const bookings = useMemo(() => data?.data ?? [], [data?.data]);

  const filteredBookings = useMemo(() => {
    if (activeTab === 'upcoming') {
      return bookings.filter(
        (b) =>
          b.status === 'REQUESTED' ||
          b.status === 'ACCEPTED' ||
          b.status === 'ARRIVING' ||
          b.status === 'ARRIVED' ||
          b.status === 'IN_PROGRESS',
      );
    }
    if (activeTab === 'completed') {
      return bookings.filter((b) => b.status === 'COMPLETED' || b.status === 'PAID');
    }
    return bookings;
  }, [bookings, activeTab]);

  const onRefresh = async (): Promise<void> => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 72 + insets.bottom + 40 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoading}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        {/* Top Header */}
        <View style={styles.header}>
          <Text variant="caption" style={styles.topCaption}>
            APPOINTMENT HISTORY
          </Text>
          <Text variant="h1" style={styles.title}>
            My Bookings
          </Text>
          <Text variant="secondary" color="secondary" style={styles.subtitle}>
            Track active appointments, specialist arrival status, and past receipts
          </Text>
        </View>

        {/* Tab Filter Pills */}
        <View style={styles.tabsRow}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'all' }}
          >
            <Text
              variant="bodyStrong"
              style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}
            >
              All ({bookings.length})
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
            onPress={() => setActiveTab('upcoming')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'upcoming' }}
          >
            <Text
              variant="bodyStrong"
              style={[styles.tabText, activeTab === 'upcoming' && styles.tabTextActive]}
            >
              Upcoming
            </Text>
          </Pressable>

          <Pressable
            style={[styles.tabBtn, activeTab === 'completed' && styles.tabBtnActive]}
            onPress={() => setActiveTab('completed')}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === 'completed' }}
          >
            <Text
              variant="bodyStrong"
              style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}
            >
              Completed
            </Text>
          </Pressable>
        </View>

        {/* Loading Skeleton */}
        {isLoading && <LoadingSkeleton height={130} count={3} />}

        {/* Error State */}
        {error && !isLoading && (
          <EmptyState
            icon="alert-circle-outline"
            title="Unable to load bookings"
            subtitle="Please check your connection and pull down to refresh."
            actionLabel="Retry"
            onAction={() => void refetch()}
          />
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredBookings.length === 0 && (
          <EmptyState
            icon="calendar-outline"
            title={
              activeTab === 'upcoming'
                ? 'No upcoming appointments'
                : activeTab === 'completed'
                  ? 'No completed bookings yet'
                  : 'No service bookings yet'
            }
            subtitle={
              activeTab === 'upcoming'
                ? "You don't have any pending service visits scheduled right now."
                : 'When you book home repairs or maintenance, your service history will appear here.'
            }
            actionLabel="Book a Service →"
            onAction={() => router.push('/')}
          />
        )}

        {/* Bookings List Cards */}
        {!isLoading && !error && (
          <View style={styles.list}>
            {filteredBookings.map((booking) => (
              <BookingCard
                key={booking.id}
                id={booking.id}
                serviceName={booking.service.name}
                scheduledStart={booking.scheduledStart}
                status={booking.status}
                amountFormatted={
                  booking.finalAmountMinor != null
                    ? `₹${(booking.finalAmountMinor / 100).toFixed(0)}`
                    : `₹${(booking.estimatedAmountMinor / 100).toFixed(0)}`
                }
                onTrack={() => router.push('/active-booking')}
              />
            ))}
          </View>
        )}
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
  },
  header: {
    marginTop: spacing.xs,
    gap: 2,
  },
  topCaption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: 3,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBtnActive: {
    backgroundColor: colors.card,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  tabText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  list: {
    gap: spacing.md,
  },
});
