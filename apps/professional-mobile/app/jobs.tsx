import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@nest/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { acceptJob, declineJob, listProfessionalJobs } from '@/lib/api';
import { EmptyState, Header, JobCard, LoadingSkeleton } from '@/components';
import { colors, radius, spacing } from '@/theme/colors';

type TabKey = 'ALL' | 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export default function JobsScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabKey>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['professional-jobs'],
    queryFn: () => listProfessionalJobs(),
  });

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
    await refetch();
    setRefreshing(false);
  };

  const allJobs = data?.data ?? [];

  const requestedJobs = allJobs.filter((j) => j.status === 'REQUESTED');
  const acceptedJobs = allJobs.filter((j) =>
    ['ACCEPTED', 'ARRIVING', 'ARRIVED'].includes(j.status),
  );
  const inProgressJobs = allJobs.filter((j) =>
    ['IN_PROGRESS', 'EXTRA_APPROVAL_PENDING'].includes(j.status),
  );
  const completedJobs = allJobs.filter((j) =>
    ['COMPLETED', 'PAYMENT_PENDING', 'PAID', 'REVIEWED'].includes(j.status),
  );

  const displayedJobs = () => {
    switch (activeTab) {
      case 'NEW':
        return requestedJobs;
      case 'ACCEPTED':
        return acceptedJobs;
      case 'IN_PROGRESS':
        return inProgressJobs;
      case 'COMPLETED':
        return completedJobs;
      case 'ALL':
      default:
        return allJobs;
    }
  };

  const currentJobs = displayedJobs();

  const tabs: Array<{ key: TabKey; label: string; count: number }> = [
    { key: 'ALL', label: 'All', count: allJobs.length },
    { key: 'NEW', label: 'New', count: requestedJobs.length },
    { key: 'ACCEPTED', label: 'Accepted', count: acceptedJobs.length },
    { key: 'IN_PROGRESS', label: 'In Progress', count: inProgressJobs.length },
    { key: 'COMPLETED', label: 'Completed', count: completedJobs.length },
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
          title="Jobs"
          subtitle="Manage assigned appointments, requests, and service progress."
        />

        {/* Filter Tabs Horizontal Control */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                style={[
                  styles.tabChip,
                  isSelected ? styles.tabChipActive : styles.tabChipInactive,
                ]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${tab.label}, ${tab.count} jobs`}
              >
                <Text
                  variant="caption"
                  style={[
                    styles.tabLabel,
                    isSelected ? styles.tabLabelActive : styles.tabLabelInactive,
                  ]}
                >
                  {tab.label}
                </Text>
                {tab.count > 0 ? (
                  <View
                    style={[
                      styles.countBadge,
                      isSelected ? styles.countBadgeActive : styles.countBadgeInactive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.countBadgeText,
                        isSelected ? styles.countBadgeTextActive : styles.countBadgeTextInactive,
                      ]}
                    >
                      {tab.count}
                    </Text>
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Loading Skeleton */}
        {isLoading && !refreshing && (
          <View style={styles.listContainer}>
            <LoadingSkeleton count={3} height={140} />
          </View>
        )}

        {/* Jobs List */}
        {!isLoading && currentJobs.length > 0 && (
          <View style={styles.listContainer}>
            {currentJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onAccept={() => acceptMutation.mutate(job.id)}
                onDecline={() => declineMutation.mutate(job.id)}
                isActionLoading={acceptMutation.isPending || declineMutation.isPending}
              />
            ))}
          </View>
        )}

        {/* Contextual Empty State */}
        {!isLoading && currentJobs.length === 0 && (
          <EmptyState
            icon={
              activeTab === 'NEW'
                ? 'notifications-outline'
                : activeTab === 'ACCEPTED'
                ? 'calendar-outline'
                : activeTab === 'IN_PROGRESS'
                ? 'construct-outline'
                : activeTab === 'COMPLETED'
                ? 'checkmark-done-circle-outline'
                : 'briefcase-outline'
            }
            title={
              activeTab === 'NEW'
                ? 'No new requests'
                : activeTab === 'ACCEPTED'
                ? 'No accepted jobs'
                : activeTab === 'IN_PROGRESS'
                ? 'No active jobs'
                : activeTab === 'COMPLETED'
                ? 'No completed jobs'
                : 'No jobs found'
            }
            description={
              activeTab === 'NEW'
                ? 'Incoming customer bookings will appear here when nearby customers request services.'
                : activeTab === 'ACCEPTED'
                ? 'Jobs you accept and are scheduled to visit will appear here.'
                : activeTab === 'IN_PROGRESS'
                ? 'Jobs you accept and are executing will appear here.'
                : activeTab === 'COMPLETED'
                ? 'Completed appointments and payment invoices will appear here.'
                : 'There are currently no job records in your partner queue.'
            }
          />
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
    gap: spacing.md,
  },
  tabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  tabChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabChipInactive: {
    backgroundColor: colors.card,
    borderColor: colors.border,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabLabelInactive: {
    color: colors.textSecondary,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: radius.full,
    minWidth: 18,
    alignItems: 'center',
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  countBadgeInactive: {
    backgroundColor: colors.surfaceSecondary,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  countBadgeTextActive: {
    color: '#FFFFFF',
  },
  countBadgeTextInactive: {
    color: colors.textSecondary,
  },
  listContainer: {
    gap: spacing.sm,
  },
});
