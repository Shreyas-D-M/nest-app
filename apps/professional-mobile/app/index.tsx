import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import type { ProfessionalProfile } from '@nest/types';
import {
  acceptJob,
  declineJob,
  getProfessionalProfile,
  listProfessionalJobs,
  setProfessionalStatus,
} from '@/lib/api';
import { JobCard, MetricCard, StatusPill } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function ProfessionalHomeScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch professional profile
  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['professional-profile'],
    queryFn: getProfessionalProfile,
  });

  // Fetch professional jobs
  const {
    data: jobsData,
    isLoading: isJobsLoading,
    refetch: refetchJobs,
  } = useQuery({
    queryKey: ['professional-jobs'],
    queryFn: () => listProfessionalJobs(),
  });

  const jobs = jobsData?.data ?? [];
  const isOnline = profile?.onlineStatus === 'ONLINE';

  // Toggle online status mutation with optimistic updates and graceful rollback
  const statusMutation = useMutation({
    mutationFn: (newOnline: boolean) =>
      setProfessionalStatus(newOnline ? 'ONLINE' : 'OFFLINE'),
    onMutate: async (newOnline: boolean) => {
      await queryClient.cancelQueries({ queryKey: ['professional-profile'] });
      const previousProfile = queryClient.getQueryData<ProfessionalProfile>(['professional-profile']);

      if (previousProfile) {
        queryClient.setQueryData<ProfessionalProfile>(['professional-profile'], {
          ...previousProfile,
          onlineStatus: newOnline ? 'ONLINE' : 'OFFLINE',
        });
      }

      return { previousProfile };
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(['professional-profile'], updatedProfile);
    },
    onError: (err: Error, _newOnline, context) => {
      if (context?.previousProfile) {
        queryClient.setQueryData(['professional-profile'], context.previousProfile);
      }
      Alert.alert('Status Update Failed', err.message);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['professional-profile'] });
    },
  });

  // Accept job mutation
  const acceptMutation = useMutation({
    mutationFn: (id: string) => acceptJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['professional-jobs'] });
      Alert.alert('Job Accepted!', 'The customer has been notified and you can now proceed.');
    },
    onError: (err: Error) => {
      Alert.alert('Failed to accept job', err.message);
    },
  });

  // Decline job mutation
  const declineMutation = useMutation({
    mutationFn: (id: string) => declineJob(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['professional-jobs'] });
    },
    onError: (err: Error) => {
      Alert.alert('Failed to decline job', err.message);
    },
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      refetchJobs(),
      queryClient.invalidateQueries({ queryKey: ['professional-profile'] }),
    ]);
    setRefreshing(false);
  };

  // Job breakdowns
  const newRequests = jobs.filter((j) => j.status === 'REQUESTED');
  const activeJobs = jobs.filter((j) =>
    ['ACCEPTED', 'ARRIVING', 'ARRIVED', 'IN_PROGRESS', 'EXTRA_APPROVAL_PENDING'].includes(j.status),
  );
  const completedToday = jobs.filter((j) => j.status === 'COMPLETED' || j.status === 'PAID');

  const todayRevenueMinor = completedToday.reduce(
    (sum, j) => sum + (j.finalAmountMinor ?? j.estimatedAmountMinor ?? 0),
    0,
  );
  const formattedTodayRevenue = `₹${((todayRevenueMinor ?? 0) / 100).toLocaleString('en-IN')}`;

  const proName = profile?.businessName ?? 'Specialist Partner';
  const proInitial = proName.slice(0, 1).toUpperCase();

  // Primary active job (if in progress or traveling)
  const currentActiveJob = activeJobs[0];

  const activeJobAmountMinor =
    currentActiveJob?.finalAmountMinor ?? currentActiveJob?.estimatedAmountMinor ?? 0;
  const formattedActiveJobAmount = `₹${((activeJobAmountMinor ?? 0) / 100).toFixed(0)}`;

  const activeJobDate = currentActiveJob?.scheduledStart
    ? new Date(currentActiveJob.scheduledStart)
    : null;
  const activeJobTime =
    activeJobDate && !isNaN(activeJobDate.getTime())
      ? activeJobDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : 'Scheduled';

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
            refreshing={refreshing || isJobsLoading}
            onRefresh={() => void onRefresh()}
            tintColor={colors.primary}
          />
        }
      >
        {/* A. Compact Partner Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.profileRow}
            onPress={() => router.push('/business')}
            accessibilityRole="button"
            accessibilityLabel="View partner business profile"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{proInitial}</Text>
            </View>
            <View style={styles.profileMeta}>
              <Text variant="h2" style={styles.partnerName} numberOfLines={1}>
                {proName}
              </Text>
              <View style={styles.badgeRow}>
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
                <Text style={styles.bulletText}>•</Text>
                <Text variant="caption" style={styles.roleCaption}>
                  Service Partner
                </Text>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={styles.notificationBtn}
            onPress={() =>
              Alert.alert('Notifications', 'All system announcements and dispatch alerts are up to date.')
            }
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={18} color={colors.text} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        {/* B. Availability Control */}
        <View
          style={[
            styles.availabilityCard,
            isOnline ? styles.availabilityCardOnline : styles.availabilityCardOffline,
          ]}
        >
          <View style={styles.availabilityTextWrap}>
            <View style={styles.availabilityStatusRow}>
              <View
                style={[
                  styles.statusIndicatorDot,
                  { backgroundColor: isOnline ? colors.online : colors.offline },
                ]}
              />
              <Text
                variant="bodyStrong"
                style={[
                  styles.availabilityStatusText,
                  { color: isOnline ? colors.successText : colors.textSecondary },
                ]}
              >
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
            <Text variant="caption" style={styles.availabilitySubtext}>
              {isOnline
                ? "You're available for nearby jobs"
                : "You're not receiving new jobs"}
            </Text>
          </View>

          <View style={styles.switchContainer}>
            <Switch
              value={isOnline}
              onValueChange={(val) => statusMutation.mutate(val)}
              disabled={statusMutation.isPending || isProfileLoading}
              trackColor={{ false: colors.border, true: colors.primaryBorder }}
              thumbColor={isOnline ? colors.primary : '#FFFFFF'}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* C. Today's Overview (2x2 Balanced Grid) */}
        <View style={styles.metricsSection}>
          <Text variant="caption" style={styles.sectionHeaderLabel}>
            Today's overview
          </Text>

          <View style={styles.metricsGrid}>
            {/* Row 1 */}
            <View style={styles.metricsRow}>
              <MetricCard
                label="Today's earnings"
                value={formattedTodayRevenue}
                icon="wallet-outline"
                iconColor={colors.primary}
                iconBg={colors.primaryLight}
                subtitle={`${completedToday.length} completed`}
              />
              <MetricCard
                label="Jobs today"
                value={completedToday.length}
                icon="calendar-outline"
                iconColor={colors.success}
                iconBg={colors.successLight}
                subtitle={`${completedToday.length} doorstep visits`}
              />
            </View>

            {/* Row 2 */}
            <View style={styles.metricsRow}>
              <MetricCard
                label="Active jobs"
                value={activeJobs.length}
                icon="time-outline"
                iconColor={colors.warning}
                iconBg={colors.warningLight}
                subtitle="In progress"
              />
              <MetricCard
                label="Pending requests"
                value={newRequests.length}
                icon="flash-outline"
                iconColor={colors.danger}
                iconBg={colors.dangerLight}
                subtitle="Needs acceptance"
              />
            </View>
          </View>
        </View>

        {/* D. Active Job (Most prominent when active) */}
        {currentActiveJob ? (
          <View style={styles.activeJobContainer}>
            <View style={styles.activeJobHeader}>
              <View style={styles.activeJobTag}>
                <Ionicons name="play" size={11} color="#FFFFFF" />
                <Text style={styles.activeJobTagText}>Active job</Text>
              </View>
              <StatusPill status={currentActiveJob.status} size="sm" />
            </View>

            <View style={styles.activeJobBody}>
              <Text variant="h2" style={styles.activeJobTitle} numberOfLines={1}>
                {currentActiveJob.service?.name ?? 'Service Execution'}
              </Text>
              <View style={styles.activeJobMetaRow}>
                <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
                <Text variant="caption" style={styles.activeJobMetaText}>
                  {currentActiveJob.customer?.name ?? 'Customer'}
                </Text>
              </View>
              <View style={styles.activeJobMetaRow}>
                <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
                <Text variant="caption" style={styles.activeJobMetaText} numberOfLines={1}>
                  {currentActiveJob.address?.locality ?? currentActiveJob.address?.city ?? 'Doorstep Location'}
                </Text>
              </View>

              <View style={styles.activeJobInfoBar}>
                <View style={styles.activeJobInfoItem}>
                  <Text variant="caption" style={styles.activeJobInfoLabel}>
                    Scheduled
                  </Text>
                  <Text variant="bodyStrong" style={styles.activeJobInfoValue}>
                    {activeJobTime}
                  </Text>
                </View>
                <View style={styles.activeJobInfoDivider} />
                <View style={styles.activeJobInfoItem}>
                  <Text variant="caption" style={styles.activeJobInfoLabel}>
                    Earnings
                  </Text>
                  <Text variant="bodyStrong" style={styles.activeJobEarningsValue}>
                    {formattedActiveJobAmount}
                  </Text>
                </View>
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.activeJobBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/job-detail',
                  params: { id: currentActiveJob.id },
                })
              }
              accessibilityRole="button"
              accessibilityLabel="Continue job"
            >
              <Text variant="bodyStrong" style={styles.activeJobBtnText}>
                Continue job →
              </Text>
            </Pressable>
          </View>
        ) : null}

        {/* E. New Job Requests */}
        <View style={styles.requestsSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.titleWithBadge}>
              <Text variant="h2" style={styles.sectionTitle}>
                New requests
              </Text>
              {newRequests.length > 0 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{newRequests.length}</Text>
                </View>
              ) : null}
            </View>

            <Pressable
              onPress={() => router.push('/jobs')}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="View all jobs"
            >
              <Text variant="caption" style={styles.viewAllText}>
                View all →
              </Text>
            </Pressable>
          </View>

          {newRequests.length > 0 ? (
            <View style={styles.requestsList}>
              {newRequests.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onAccept={() => acceptMutation.mutate(job.id)}
                  onDecline={() => declineMutation.mutate(job.id)}
                  isActionLoading={acceptMutation.isPending || declineMutation.isPending}
                />
              ))}
            </View>
          ) : (
            /* Contextual Compact Empty State */
            <View style={styles.emptyStateCard}>
              <View
                style={[
                  styles.emptyIconCircle,
                  { backgroundColor: isOnline ? colors.successLight : colors.surfaceSecondary },
                ]}
              >
                <Ionicons
                  name={isOnline ? 'radio-outline' : 'power-outline'}
                  size={20}
                  color={isOnline ? colors.success : colors.textSecondary}
                />
              </View>
              <Text variant="bodyStrong" style={styles.emptyTitle}>
                {isOnline ? "You're all caught up" : "You're offline"}
              </Text>
              <Text variant="caption" style={styles.emptySubtitle}>
                {isOnline
                  ? "We'll notify you when a new nearby job arrives."
                  : 'Go online to start receiving nearby jobs.'}
              </Text>
            </View>
          )}
        </View>

        {/* Other Active Jobs in queue (if > 1) */}
        {activeJobs.length > 1 && (
          <View style={styles.requestsSection}>
            <View style={styles.sectionTitleRow}>
              <Text variant="h2" style={styles.sectionTitle}>
                Other active jobs ({activeJobs.length - 1})
              </Text>
            </View>
            <View style={styles.requestsList}>
              {activeJobs.slice(1).map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </View>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    gap: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  profileMeta: {
    flex: 1,
    gap: 2,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  bulletText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  roleCaption: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  notificationBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.danger,
  },
  availabilityCard: {
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    ...shadows.sm,
  },
  availabilityCardOnline: {
    backgroundColor: colors.onlineLight,
    borderColor: colors.onlineBorder,
  },
  availabilityCardOffline: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  availabilityTextWrap: {
    flex: 1,
    gap: 2,
  },
  availabilityStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availabilityStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  availabilitySubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  switchContainer: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsSection: {
    gap: spacing.xs,
  },
  sectionHeaderLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  metricsGrid: {
    gap: spacing.sm,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  activeJobContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    ...shadows.sm,
    gap: spacing.sm,
  },
  activeJobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  activeJobTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  activeJobTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  activeJobBody: {
    gap: 4,
  },
  activeJobTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  activeJobMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeJobMetaText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  activeJobInfoBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginTop: 4,
  },
  activeJobInfoItem: {
    flex: 1,
    gap: 1,
  },
  activeJobInfoDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.sm,
  },
  activeJobInfoLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  activeJobInfoValue: {
    fontSize: 12,
    color: colors.text,
  },
  activeJobEarningsValue: {
    fontSize: 13,
    color: colors.successText,
    fontWeight: '700',
  },
  activeJobBtn: {
    minHeight: 44,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  activeJobBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  requestsSection: {
    gap: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  viewAllText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  requestsList: {
    gap: spacing.sm,
  },
  emptyStateCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: 3,
  },
  emptyIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
