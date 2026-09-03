import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Text } from '@nest/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import {
  acceptJob,
  completeJob,
  declineJob,
  getProfessionalJob,
  markJobArrived,
  proposeExtraWork,
  startJob,
} from '@/lib/api';
import { ExtraWorkModal, Header, StatusPill } from '@/components';
import { colors, radius, shadows, spacing } from '@/theme/colors';

export default function JobDetailScreen(): ReactElement {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [extraWorkModalVisible, setExtraWorkModalVisible] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['professional-job', id],
    queryFn: () => (id ? getProfessionalJob(id) : Promise.resolve(null)),
    enabled: Boolean(id),
  });

  const mutationOptions = {
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['professional-job', id] });
      void queryClient.invalidateQueries({ queryKey: ['professional-jobs'] });
    },
    onError: (err: Error) => {
      Alert.alert('Action Failed', err.message);
    },
  };

  const acceptMutation = useMutation({
    mutationFn: () => acceptJob(id!),
    onSuccess: () => {
      mutationOptions.onSuccess();
      Alert.alert('Job Accepted!', 'The customer has been notified and you can now proceed to customer doorstep.');
    },
    onError: mutationOptions.onError,
  });

  const declineMutation = useMutation({
    mutationFn: () => declineJob(id!),
    onSuccess: () => {
      mutationOptions.onSuccess();
      router.back();
    },
    onError: mutationOptions.onError,
  });

  const arrivedMutation = useMutation({
    mutationFn: () => markJobArrived(id!),
    onSuccess: () => {
      mutationOptions.onSuccess();
      Alert.alert('Arrived at Location', 'You can inspect the issue with the customer and start service.');
    },
    onError: mutationOptions.onError,
  });

  const startMutation = useMutation({
    mutationFn: () => startJob(id!),
    onSuccess: () => {
      mutationOptions.onSuccess();
      Alert.alert('Service Started', 'Service execution is now in progress.');
    },
    onError: mutationOptions.onError,
  });

  const extraWorkMutation = useMutation({
    mutationFn: (dto: { description: string; amountMinor: number }) =>
      proposeExtraWork(id!, dto),
    onSuccess: () => {
      setExtraWorkModalVisible(false);
      mutationOptions.onSuccess();
      Alert.alert('Quote Sent', 'Customer has been notified of the extra work quote for approval.');
    },
    onError: mutationOptions.onError,
  });

  const completeMutation = useMutation({
    mutationFn: () => completeJob(id!),
    onSuccess: () => {
      mutationOptions.onSuccess();
      Alert.alert('Job Completed!', 'Service marked completed. Payment invoice has been submitted to the customer.');
    },
    onError: mutationOptions.onError,
  });

  const handleCallCustomer = () => {
    if (job?.customer?.phone) {
      void Linking.openURL(`tel:${job.customer.phone}`);
    }
  };

  const handleOpenMaps = () => {
    if (job?.address) {
      const query = encodeURIComponent(
        `${job.address.addressLine}, ${job.address.locality}, ${job.address.city}`,
      );
      void Linking.openURL(`https://maps.google.com/?q=${query}`);
    }
  };

  const handlePromptComplete = () => {
    Alert.alert(
      'Complete Service',
      'Have you finished all service work and verified resolution with the customer?',
      [
        { text: 'Not yet', style: 'cancel' },
        {
          text: 'Yes, Complete Job',
          style: 'default',
          onPress: () => completeMutation.mutate(),
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text variant="secondary" color="secondary" style={{ marginTop: 12 }}>
            Loading job details…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !job) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
          <Text variant="h2" style={{ marginTop: 12, color: colors.text }}>
            Job not found
          </Text>
          <View style={{ marginTop: 16 }}>
            <Button label="Go back" onPress={() => router.back()} />
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const scheduledDate = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const isDateValid = scheduledDate !== null && !isNaN(scheduledDate.getTime());
  const formattedDate = isDateValid
    ? scheduledDate.toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : 'Scheduled Appointment';
  const formattedTime = isDateValid
    ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Flexible Timing';
  const amountMinor = job.finalAmountMinor ?? job.estimatedAmountMinor ?? 0;
  const formattedAmount =
    typeof amountMinor === 'number' && !isNaN(amountMinor)
      ? `₹${(amountMinor / 100).toFixed(0)}`
      : '₹0';

  const serviceName = job.service?.name ?? 'Service Execution';
  const customerName = job.customer?.name ?? 'Customer';
  const customerPhone = job.customer?.phone ?? '';
  const locality = job.address?.locality;
  const city = job.address?.city;
  const addressLine = job.address?.addressLine ?? '';
  const instructions = job.address?.instructions;
  const locationTitle = locality && city ? `${locality}, ${city}` : locality || city || 'Service Address';
  const items = job.items ?? [];

  const isPerformingAction =
    acceptMutation.isPending ||
    declineMutation.isPending ||
    arrivedMutation.isPending ||
    startMutation.isPending ||
    completeMutation.isPending;

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header: Back + Service Name + Status */}
        <Header
          showBack
          title={serviceName}
          subtitle={`Booking ID: ${job.id.slice(0, 8)}`}
          rightElement={<StatusPill status={job.status} />}
        />

        {/* 1. CUSTOMER Card */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.sectionLabel}>
            Customer
          </Text>

          <View style={styles.customerRow}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={18} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={styles.customerName}>
                {customerName}
              </Text>
              {customerPhone ? (
                <Text variant="caption" color="secondary">
                  {customerPhone}
                </Text>
              ) : null}
            </View>
            {customerPhone ? (
              <Pressable
                style={({ pressed }) => [
                  styles.callButton,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleCallCustomer}
                accessibilityRole="button"
                accessibilityLabel="Call customer"
              >
                <Ionicons name="call" size={15} color="#FFFFFF" />
                <Text variant="caption" style={styles.callButtonText}>
                  Call
                </Text>
              </Pressable>
            ) : null}
          </View>
        </View>

        {/* 2. LOCATION Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text variant="caption" style={styles.sectionLabel}>
              Location
            </Text>
            <Pressable
              style={({ pressed }) => [
                styles.actionLink,
                pressed && styles.btnPressed,
              ]}
              onPress={handleOpenMaps}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Open directions in Maps"
            >
              <Ionicons name="navigate-outline" size={14} color={colors.primary} />
              <Text variant="caption" style={styles.actionLinkText}>
                Directions
              </Text>
            </Pressable>
          </View>

          <View style={styles.locationBox}>
            <Ionicons name="location-outline" size={20} color={colors.primary} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={styles.locationTitle}>
                {locationTitle}
              </Text>
              {addressLine ? (
                <Text variant="caption" color="secondary" style={{ marginTop: 2 }}>
                  {addressLine}
                </Text>
              ) : null}
              {instructions ? (
                <View style={styles.instructionsWrap}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
                  <Text variant="caption" color="secondary" style={{ flex: 1 }}>
                    {instructions}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        {/* 3. SCHEDULE Card */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.sectionLabel}>
            Schedule
          </Text>
          <View style={styles.scheduleRow}>
            <View style={styles.scheduleItem}>
              <Text variant="caption" style={styles.scheduleSublabel}>
                Date
              </Text>
              <Text variant="bodyStrong" style={styles.scheduleValue}>
                {formattedDate}
              </Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text variant="caption" style={styles.scheduleSublabel}>
                Time Window
              </Text>
              <Text variant="bodyStrong" style={styles.scheduleValue}>
                {formattedTime}
              </Text>
            </View>
          </View>
        </View>

        {/* 4. SERVICE & Price Card */}
        <View style={styles.card}>
          <Text variant="caption" style={styles.sectionLabel}>
            Service & Payout
          </Text>
          <View style={styles.serviceRow}>
            <View style={{ flex: 1 }}>
              <Text variant="bodyStrong" style={styles.serviceTitle}>
                {serviceName}
              </Text>
              <Text variant="caption" color="secondary">
                {job.service?.categoryName ?? 'Home Service'} · Guaranteed payout
              </Text>
            </View>
            <View style={styles.priceWrap}>
              <Text variant="h2" style={styles.priceValue}>
                {formattedAmount}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. CUSTOMER NOTE (Problem Description) */}
        {job.notes ? (
          <View style={styles.card}>
            <Text variant="caption" style={styles.sectionLabel}>
              Customer Note
            </Text>
            <View style={styles.notesBox}>
              <Text variant="body" style={styles.notesText}>
                {job.notes}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Extra Work & Line Items */}
        {items.length > 0 && (
          <View style={styles.card}>
            <Text variant="caption" style={styles.sectionLabel}>
              Service Line Items & Quotes
            </Text>
            <View style={styles.itemsList}>
              {items.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text variant="body" style={{ color: colors.text }}>
                      {item.description}
                    </Text>
                    <Text
                      variant="caption"
                      style={{
                        color: item.approved ? colors.successText : colors.warningText,
                        fontWeight: '600',
                      }}
                    >
                      Qty: {item.quantity} · {item.approved ? 'Approved' : 'Pending Approval'}
                    </Text>
                  </View>
                  <Text variant="bodyStrong" style={{ color: colors.text }}>
                    ₹{((item.unitPriceMinor * item.quantity) / 100).toFixed(0)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Persistent Bottom Action Area */}
      <View style={[styles.bottomStickyBar, { paddingBottom: insets.bottom + 12 }]}>
        {job.status === 'REQUESTED' && (
          <View style={styles.doubleActionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.declineFullBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={() => declineMutation.mutate()}
              disabled={isPerformingAction}
              accessibilityRole="button"
              accessibilityLabel="Decline job request"
            >
              <Text variant="bodyStrong" style={{ color: colors.textSecondary }}>
                Decline
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={() => acceptMutation.mutate()}
              disabled={isPerformingAction}
              accessibilityRole="button"
              accessibilityLabel="Accept job request"
            >
              {acceptMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text variant="bodyStrong" style={styles.primaryActionBtnText}>
                  Accept Job →
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {(job.status === 'ACCEPTED' || job.status === 'ARRIVING') && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={() => arrivedMutation.mutate()}
            disabled={isPerformingAction}
            accessibilityRole="button"
            accessibilityLabel="Mark arrived at customer doorstep"
          >
            {arrivedMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text variant="bodyStrong" style={styles.primaryActionBtnText}>
                Mark Arrived
              </Text>
            )}
          </Pressable>
        )}

        {job.status === 'ARRIVED' && (
          <Pressable
            style={({ pressed }) => [
              styles.primaryActionBtn,
              pressed && styles.btnPressed,
            ]}
            onPress={() => startMutation.mutate()}
            disabled={isPerformingAction}
            accessibilityRole="button"
            accessibilityLabel="Start service execution"
          >
            {startMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text variant="bodyStrong" style={styles.primaryActionBtnText}>
                Start Service
              </Text>
            )}
          </Pressable>
        )}

        {job.status === 'IN_PROGRESS' && (
          <View style={styles.inProgressActionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.extraWorkBtn,
                pressed && styles.btnPressed,
              ]}
              onPress={() => setExtraWorkModalVisible(true)}
              disabled={isPerformingAction}
              accessibilityRole="button"
              accessibilityLabel="Propose extra work quote"
            >
              <Ionicons name="add-circle-outline" size={17} color={colors.primary} />
              <Text variant="bodyStrong" style={styles.extraWorkBtnText}>
                Extra Work
              </Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.primaryActionBtn,
                { flex: 1 },
                pressed && styles.btnPressed,
              ]}
              onPress={handlePromptComplete}
              disabled={isPerformingAction}
              accessibilityRole="button"
              accessibilityLabel="Complete service"
            >
              {completeMutation.isPending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text variant="bodyStrong" style={styles.primaryActionBtnText}>
                  Complete Service ✓
                </Text>
              )}
            </Pressable>
          </View>
        )}

        {job.status === 'COMPLETED' || job.status === 'PAID' ? (
          <View style={styles.completedNoticeRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text variant="bodyStrong" style={{ color: colors.successText }}>
              Service Completed Successfully
            </Text>
          </View>
        ) : null}
      </View>

      {/* Extra Work Modal */}
      <ExtraWorkModal
        visible={extraWorkModalVisible}
        onClose={() => setExtraWorkModalVisible(false)}
        onSubmit={(dto) => extraWorkMutation.mutate(dto)}
        isLoading={extraWorkMutation.isPending}
      />
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  actionLinkText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 12,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    height: 38,
    borderRadius: radius.sm,
  },
  callButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 12,
  },
  locationBox: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  instructionsWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: spacing.xs,
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.sm,
    borderRadius: radius.sm,
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scheduleItem: {
    flex: 1,
    gap: 2,
  },
  scheduleSublabel: {
    fontSize: 11,
    color: colors.textMuted,
  },
  scheduleValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  scheduleDivider: {
    width: 1,
    height: 32,
    backgroundColor: colors.borderLight,
    marginHorizontal: spacing.md,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
  },
  priceWrap: {
    alignItems: 'flex-end',
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.successText,
  },
  notesBox: {
    backgroundColor: colors.surfaceSecondary,
    padding: spacing.md,
    borderRadius: radius.sm,
  },
  notesText: {
    color: colors.text,
    lineHeight: 20,
    fontSize: 13,
  },
  itemsList: {
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  bottomStickyBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  doubleActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  declineFullBtn: {
    flex: 1,
    minHeight: 46,
    backgroundColor: colors.surfaceSecondary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  primaryActionBtn: {
    flex: 2,
    minHeight: 46,
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  inProgressActionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  extraWorkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 46,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.primaryLight,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    borderRadius: radius.sm,
    justifyContent: 'center',
  },
  extraWorkBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  completedNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: spacing.xs,
  },
  btnPressed: {
    opacity: 0.85,
  },
});
