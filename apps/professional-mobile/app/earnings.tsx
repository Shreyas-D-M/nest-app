import { Ionicons } from '@expo/vector-icons';
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
import { useState, type ReactElement } from 'react';
import { listProfessionalJobs } from '@/lib/api';
import { EmptyState, Header, MetricCard, StatusPill } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

type Period = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

export default function EarningsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>('TODAY');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['professional-jobs'],
    queryFn: () => listProfessionalJobs(),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const jobs = data?.data ?? [];
  const completedJobs = jobs.filter((j) =>
    ['COMPLETED', 'PAYMENT_PENDING', 'PAID', 'REVIEWED'].includes(j.status),
  );

  // Period filtering logic
  const now = new Date();
  const filteredJobs = completedJobs.filter((job) => {
    if (!job?.scheduledStart) return period === 'ALL';
    const jobDate = new Date(job.scheduledStart);
    if (isNaN(jobDate.getTime())) return period === 'ALL';
    if (period === 'TODAY') {
      return (
        jobDate.getDate() === now.getDate() &&
        jobDate.getMonth() === now.getMonth() &&
        jobDate.getFullYear() === now.getFullYear()
      );
    }
    if (period === 'WEEK') {
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return jobDate >= oneWeekAgo;
    }
    if (period === 'MONTH') {
      return (
        jobDate.getMonth() === now.getMonth() &&
        jobDate.getFullYear() === now.getFullYear()
      );
    }
    return true; // ALL
  });

  const totalEarningsMinor = filteredJobs.reduce(
    (sum, job) => sum + (job.finalAmountMinor ?? job.estimatedAmountMinor ?? 0),
    0,
  );
  const formattedTotal = `₹${((totalEarningsMinor ?? 0) / 100).toLocaleString('en-IN')}`;

  const avgPerJobMinor =
    filteredJobs.length > 0 ? Math.round(totalEarningsMinor / filteredJobs.length) : 0;
  const formattedAvg = `₹${(avgPerJobMinor / 100).toFixed(0)}`;

  const periods: Array<{ key: Period; label: string }> = [
    { key: 'TODAY', label: 'Today' },
    { key: 'WEEK', label: 'This week' },
    { key: 'MONTH', label: 'This month' },
    { key: 'ALL', label: 'All time' },
  ];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 32 },
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
        <Header
          title="Earnings"
          subtitle="Direct deposit summaries and completed service payout statements."
        />

        {/* Hero Revenue Card with Large ₹XX,XXX */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <Text variant="caption" style={styles.heroCaption}>
                {period === 'TODAY'
                  ? "Today's earnings"
                  : period === 'WEEK'
                  ? "This week's earnings"
                  : period === 'MONTH'
                  ? "This month's earnings"
                  : 'Total lifetime earnings'}
              </Text>
              <Text variant="h1" style={styles.heroAmount}>
                {formattedTotal}
              </Text>
            </View>

            <View style={styles.payoutBadge}>
              <Ionicons name="shield-checkmark-outline" size={13} color={colors.successText} />
              <Text style={styles.payoutBadgeText}>Direct deposit</Text>
            </View>
          </View>

          <View style={styles.heroDivider} />

          <Text variant="caption" style={styles.heroNote}>
            Settlements deposited directly to your bank account weekly.
          </Text>
        </View>

        {/* Period Selector Segmented Control */}
        <View style={styles.periodTabs}>
          {periods.map((p) => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                style={[
                  styles.periodTab,
                  isSelected && styles.periodTabActive,
                ]}
                onPress={() => setPeriod(p.key)}
                accessibilityRole="button"
                accessibilityLabel={`Select period ${p.label}`}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.periodTabLabel,
                    isSelected ? styles.periodTabLabelActive : styles.periodTabLabelInactive,
                  ]}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* 2-Column Supporting Metric Cards */}
        <View style={styles.metricsRow}>
          <MetricCard
            label="Average per job"
            value={formattedAvg}
            icon="cash-outline"
            iconColor={colors.primary}
            iconBg={colors.primaryLight}
            subtitle="Per completed visit"
          />
          <MetricCard
            label="Completed jobs"
            value={filteredJobs.length}
            icon="checkmark-done-circle-outline"
            iconColor={colors.success}
            iconBg={colors.successLight}
            subtitle="In selected period"
          />
        </View>

        {/* Payout History Section */}
        <View style={styles.historySection}>
          <Text variant="h2" style={styles.historyTitle}>
            Payout history
          </Text>

          {filteredJobs.length > 0 ? (
            <View style={styles.transactionsCard}>
              {filteredJobs.map((job, idx) => {
                const amount = job.finalAmountMinor ?? job.estimatedAmountMinor ?? 0;
                const formattedJobAmount = `+₹${((amount ?? 0) / 100).toFixed(0)}`;
                const scheduledDate = job.scheduledStart ? new Date(job.scheduledStart) : null;
                const dateText =
                  scheduledDate && !isNaN(scheduledDate.getTime())
                    ? scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
                    : 'Completed';

                return (
                  <View key={job.id}>
                    {idx > 0 && <View style={styles.itemSeparator} />}
                    <View style={styles.transactionRow}>
                      <View style={styles.iconCircle}>
                        <Ionicons name="receipt-outline" size={16} color={colors.primary} />
                      </View>

                      <View style={styles.txDetails}>
                        <Text variant="bodyStrong" style={styles.txService} numberOfLines={1}>
                          {job.service?.name ?? 'Service Execution'}
                        </Text>
                        <Text variant="caption" color="secondary" numberOfLines={1}>
                          {job.customer?.name ?? 'Customer'} · {dateText}
                        </Text>
                      </View>

                      <View style={styles.txAmountWrap}>
                        <Text variant="bodyStrong" style={styles.txAmount}>
                          {formattedJobAmount}
                        </Text>
                        <StatusPill status={job.status} size="sm" />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState
              icon="wallet-outline"
              title="No earnings in this period"
              description="Complete assigned customer service appointments to see your itemized earnings here."
            />
          )}
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroCaption: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  heroAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.8,
    marginTop: 2,
  },
  payoutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.successLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.successBorder,
  },
  payoutBadgeText: {
    color: colors.successText,
    fontSize: 11,
    fontWeight: '600',
  },
  heroDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  heroNote: {
    fontSize: 11,
    color: colors.textMuted,
    lineHeight: 15,
  },
  periodTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.md,
    padding: 3,
  },
  periodTab: {
    flex: 1,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  periodTabActive: {
    backgroundColor: colors.card,
    ...shadows.sm,
  },
  periodTabLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  periodTabLabelActive: {
    color: colors.text,
  },
  periodTabLabelInactive: {
    color: colors.textSecondary,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  historySection: {
    gap: spacing.sm,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  transactionsCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    paddingHorizontal: spacing.md,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txDetails: {
    flex: 1,
    gap: 2,
  },
  txService: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  txAmountWrap: {
    alignItems: 'flex-end',
    gap: 4,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.successText,
  },
  itemSeparator: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
});
