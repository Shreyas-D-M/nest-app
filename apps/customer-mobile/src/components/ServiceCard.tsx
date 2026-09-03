import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface ServiceCardProps {
  name: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  badge?: string;
  badgeBg?: string;
  badgeColor?: string;
  onPress: () => void;
}

export function ServiceCard({
  name,
  icon,
  iconColor,
  iconBg,
  badge,
  badgeBg,
  badgeColor,
  onPress,
}: ServiceCardProps): ReactElement {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Service: ${name}`}
    >
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <Text variant="bodyStrong" style={styles.name} numberOfLines={2}>
        {name}
      </Text>
      {badge ? (
        <View style={[styles.badge, { backgroundColor: badgeBg ?? colors.warningLight }]}>
          <Text style={[styles.badgeText, { color: badgeColor ?? colors.warningText }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '23%',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: 2,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
    minHeight: 88,
    justifyContent: 'center',
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 8,
    fontWeight: '700',
  },
});
