import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface BookingCardProps {
  id: string;
  serviceName: string;
  scheduledStart: string | Date;
  status: string;
  amountFormatted?: string;
  specialistName?: string;
  onTrack: () => void;
}

export function BookingCard({
  serviceName,
  scheduledStart,
  status,
  amountFormatted,
  specialistName,
  onTrack,
}: BookingCardProps): ReactElement {
  const isCompleted = status === 'COMPLETED' || status === 'PAID';
  const formattedDate = new Date(scheduledStart).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onTrack}
      accessibilityRole="button"
      accessibilityLabel={`Booking for ${serviceName}`}
    >
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name="construct-outline" size={20} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text variant="bodyStrong" style={styles.serviceName}>
            {serviceName}
          </Text>
          <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
            {formattedDate}
          </Text>
          {specialistName ? (
            <Text variant="caption" style={styles.specialistText}>
              Specialist: {specialistName}
            </Text>
          ) : null}
        </View>

        <View
          style={[
            styles.statusPill,
            isCompleted ? styles.statusPillDone : styles.statusPillActive,
          ]}
        >
          <Text
            variant="caption"
            style={[
              styles.statusText,
              isCompleted ? styles.statusTextDone : styles.statusTextActive,
            ]}
          >
            {status}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        {amountFormatted ? (
          <View>
            <Text variant="caption" color="secondary">
              Amount
            </Text>
            <Text variant="bodyStrong" style={styles.price}>
              {amountFormatted}
            </Text>
          </View>
        ) : <View />}

        <View style={styles.trackBtn}>
          <Text variant="caption" style={styles.trackBtnText}>
            Track appointment →
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    gap: spacing.sm,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  specialistText: {
    fontSize: 11,
    color: colors.primaryDark,
    fontWeight: '600',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  statusPillActive: {
    backgroundColor: colors.primaryLight,
  },
  statusPillDone: {
    backgroundColor: colors.successLight,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusTextActive: {
    color: colors.primary,
  },
  statusTextDone: {
    color: colors.successText,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  price: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  trackBtn: {
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  trackBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
});
