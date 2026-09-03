import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export function TrustBadge(): ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.item}>
        <Ionicons name="shield-checkmark" size={17} color={colors.success} />
        <Text variant="caption" style={styles.text}>
          Verified Pros
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="pricetag" size={17} color={colors.primary} />
        <Text variant="caption" style={styles.text}>
          Upfront Pricing
        </Text>
      </View>
      <View style={styles.divider} />
      <View style={styles.item}>
        <Ionicons name="medal" size={17} color={colors.warning} />
        <Text variant="caption" style={styles.text}>
          30-Day Guarantee
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  text: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    width: 1,
    height: 18,
    backgroundColor: colors.border,
  },
});
