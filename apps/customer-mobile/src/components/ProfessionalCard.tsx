import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface ProfessionalCardProps {
  id: string;
  name: string;
  serviceName: string;
  rating?: string;
  reviewsCount?: string;
  experience?: string;
  priceFormatted?: string;
  initial?: string;
  avatarBg?: string;
  isVerified?: boolean;
  onBook: () => void;
}

export function ProfessionalCard({
  name,
  serviceName,
  rating = '4.9',
  reviewsCount = '120',
  experience = '5 yrs exp',
  priceFormatted = 'From ₹499',
  initial,
  avatarBg = colors.primary,
  isVerified = true,
  onBook,
}: ProfessionalCardProps): ReactElement {
  const displayInitial = initial ?? name.slice(0, 1).toUpperCase();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
          <Text variant="bodyStrong" color="inverse" style={{ fontSize: 16 }}>
            {displayInitial}
          </Text>
        </View>

        <View style={{ flex: 1 }}>
          <View style={styles.nameRow}>
            <Text variant="bodyStrong" style={styles.name}>
              {name}
            </Text>
            {isVerified ? (
              <View style={styles.verifiedTag}>
                <Ionicons name="shield-checkmark" size={11} color={colors.success} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : null}
          </View>
          <Text variant="caption" color="secondary" style={{ marginTop: 1 }}>
            {serviceName} · {experience}
          </Text>
        </View>

        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={colors.warning} />
          <Text variant="caption" style={styles.ratingText}>
            {rating}
          </Text>
          <Text variant="caption" color="secondary" style={{ fontSize: 10 }}>
            ({reviewsCount})
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View>
          <Text variant="caption" color="secondary">
            Starting estimate
          </Text>
          <Text variant="bodyStrong" style={styles.price}>
            {priceFormatted}
          </Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.bookBtn, pressed && styles.bookBtnPressed]}
          onPress={onBook}
          accessibilityRole="button"
          accessibilityLabel={`Book ${name}`}
        >
          <Text variant="bodyStrong" color="inverse" style={{ fontSize: 13 }}>
            Book specialist →
          </Text>
        </Pressable>
      </View>
    </View>
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
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.successLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.successText,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.sm,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warningText,
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
  bookBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
  },
  bookBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
});
