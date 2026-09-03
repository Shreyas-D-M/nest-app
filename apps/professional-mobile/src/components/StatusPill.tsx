import { StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius } from '../theme/colors';

export type JobOrOnlineStatus =
  | 'ONLINE'
  | 'OFFLINE'
  | 'BUSY'
  | 'REQUESTED'
  | 'ACCEPTED'
  | 'ARRIVING'
  | 'ARRIVED'
  | 'IN_PROGRESS'
  | 'EXTRA_APPROVAL_PENDING'
  | 'COMPLETED'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'REVIEWED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_PROFESSIONAL'
  | 'CANCELLED_BY_ADMIN'
  | 'VERIFIED'
  | 'PENDING_REVIEW'
  | 'REJECTED';

interface StatusPillProps {
  status: JobOrOnlineStatus | string;
  size?: 'sm' | 'md';
}

export function StatusPill({ status, size = 'md' }: StatusPillProps): ReactElement {
  const getTheme = () => {
    switch (status) {
      case 'ONLINE':
      case 'COMPLETED':
      case 'PAID':
      case 'VERIFIED':
        return {
          bg: colors.successLight,
          border: colors.successBorder,
          text: colors.successText,
          label:
            status === 'ONLINE'
              ? 'Online'
              : status === 'PAID'
              ? 'Paid'
              : status === 'VERIFIED'
              ? 'Verified'
              : 'Completed',
          dot: colors.success,
        };
      case 'BUSY':
      case 'REQUESTED':
      case 'ARRIVING':
      case 'ARRIVED':
      case 'IN_PROGRESS':
      case 'EXTRA_APPROVAL_PENDING':
      case 'PENDING_REVIEW':
        return {
          bg: colors.warningLight,
          border: colors.warningBorder,
          text: colors.warningText,
          label:
            status === 'REQUESTED'
              ? 'New Request'
              : status === 'ARRIVING'
              ? 'En Route'
              : status === 'ARRIVED'
              ? 'Arrived'
              : status === 'IN_PROGRESS'
              ? 'In Progress'
              : status === 'EXTRA_APPROVAL_PENDING'
              ? 'Extra Work Pending'
              : status === 'PENDING_REVIEW'
              ? 'Pending Review'
              : status,
          dot: colors.warning,
        };
      case 'ACCEPTED':
        return {
          bg: colors.primaryLight,
          border: colors.primaryBorder,
          text: colors.primary,
          label: 'Accepted',
          dot: colors.primary,
        };
      case 'OFFLINE':
        return {
          bg: colors.surfaceMuted,
          border: colors.border,
          text: colors.textSecondary,
          label: 'Offline',
          dot: colors.offline,
        };
      case 'CANCELLED_BY_CUSTOMER':
      case 'CANCELLED_BY_PROFESSIONAL':
      case 'CANCELLED_BY_ADMIN':
      case 'REJECTED':
        return {
          bg: colors.dangerLight,
          border: colors.dangerBorder,
          text: colors.dangerText,
          label: 'Cancelled',
          dot: colors.danger,
        };
      default:
        return {
          bg: colors.surfaceMuted,
          border: colors.border,
          text: colors.textSecondary,
          label: status,
          dot: colors.textMuted,
        };
    }
  };

  const currentTheme = getTheme();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.pill,
        {
          backgroundColor: currentTheme.bg,
          borderColor: currentTheme.border,
          paddingVertical: isSmall ? 2 : 3,
          paddingHorizontal: isSmall ? 7 : 9,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: currentTheme.dot }]} />
      <Text
        variant="caption"
        style={[
          styles.label,
          {
            color: currentTheme.text,
            fontSize: isSmall ? 10 : 11,
          },
        ]}
      >
        {currentTheme.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});
