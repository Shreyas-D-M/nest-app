import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ProfessionalJobView } from '@nest/types';
import type { ReactElement } from 'react';
import { StatusPill } from './StatusPill';
import { colors, radius, shadows, spacing } from '../theme/colors';

export interface JobCardProps {
  job: ProfessionalJobView;
  onAccept?: () => void;
  onDecline?: () => void;
  isActionLoading?: boolean;
}

export function JobCard({
  job,
  onAccept,
  onDecline,
  isActionLoading = false,
}: JobCardProps): ReactElement {
  const isRequested = job.status === 'REQUESTED';
  const amountMinor = job.finalAmountMinor ?? job.estimatedAmountMinor ?? 0;
  const formattedAmount =
    typeof amountMinor === 'number' && !isNaN(amountMinor)
      ? `₹${(amountMinor / 100).toFixed(0)}`
      : '₹0';

  const scheduledDate = job.scheduledStart ? new Date(job.scheduledStart) : null;
  const isDateValid = scheduledDate !== null && !isNaN(scheduledDate.getTime());
  const formattedTime = isDateValid
    ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : 'Flexible';
  const formattedDate = isDateValid
    ? scheduledDate.toLocaleDateString([], { month: 'short', day: 'numeric' })
    : 'Scheduled';

  const serviceName = job.service?.name ?? 'Home Service';
  const customerName = job.customer?.name ?? 'Customer';
  const locality = job.address?.locality;
  const city = job.address?.city;
  const locationText = locality && city ? `${locality}, ${city}` : locality || city || 'Doorstep Location';

  const handleCardPress = () => {
    router.push({
      pathname: '/job-detail',
      params: { id: job.id },
    });
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={handleCardPress}
      accessibilityRole="button"
      accessibilityLabel={`View job for ${customerName}`}
    >
      {/* Top: Service Name & Status Badge */}
      <View style={styles.topRow}>
        <Text variant="bodyStrong" style={styles.serviceName} numberOfLines={1}>
          {serviceName}
        </Text>
        <StatusPill status={job.status} size="sm" />
      </View>

      {/* Middle: Customer, Location, Scheduled Time */}
      <View style={styles.middleSection}>
        <View style={styles.infoRow}>
          <Ionicons name="person-outline" size={13} color={colors.textSecondary} />
          <Text variant="body" style={styles.customerName} numberOfLines={1}>
            {customerName}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
          <Text variant="caption" style={styles.metaText} numberOfLines={1}>
            {locationText}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text variant="caption" style={styles.metaText}>
            {formattedDate} · {formattedTime}
          </Text>
        </View>
      </View>

      {/* Bottom: Earnings & Actions */}
      <View style={styles.bottomRow}>
        <View style={styles.earningsBlock}>
          <Text variant="caption" style={styles.earningsLabel}>
            {job.status === 'COMPLETED' || job.status === 'PAID' ? 'Earned' : 'Estimated payout'}
          </Text>
          <Text variant="h2" style={styles.earningsAmount}>
            {formattedAmount}
          </Text>
        </View>

        {isRequested ? (
          <View style={styles.actionButtons}>
            {onDecline ? (
              <Pressable
                style={({ pressed }) => [
                  styles.declineBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onDecline();
                }}
                disabled={isActionLoading}
                accessibilityRole="button"
                accessibilityLabel="Decline job request"
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color={colors.textSecondary} />
                ) : (
                  <Text variant="bodyStrong" style={styles.declineBtnText}>
                    Decline
                  </Text>
                )}
              </Pressable>
            ) : null}

            {onAccept ? (
              <Pressable
                style={({ pressed }) => [
                  styles.acceptBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  onAccept();
                }}
                disabled={isActionLoading}
                accessibilityRole="button"
                accessibilityLabel="Accept job request"
              >
                {isActionLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text variant="bodyStrong" style={styles.acceptBtnText}>
                    Accept
                  </Text>
                )}
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={styles.viewDetailsRow}>
            <Text variant="caption" style={styles.viewDetailsText}>
              View details
            </Text>
            <Ionicons name="chevron-forward" size={14} color={colors.primary} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
    gap: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.surfaceSubtle,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  middleSection: {
    gap: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  customerName: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    flex: 1,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  earningsBlock: {
    gap: 1,
  },
  earningsLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  earningsAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  declineBtn: {
    minHeight: 40,
    minWidth: 76,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  declineBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  acceptBtn: {
    minHeight: 40,
    minWidth: 84,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.primary,
  },
  acceptBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  btnPressed: {
    opacity: 0.85,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
