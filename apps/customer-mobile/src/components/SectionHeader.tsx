import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement } from 'react';
import { colors, spacing } from '../theme/colors';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  rightActionText?: string;
  onRightActionPress?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  rightActionText,
  onRightActionPress,
}: SectionHeaderProps): ReactElement {
  return (
    <View style={styles.container}>
      <View style={styles.textWrap}>
        <Text variant="h2" style={styles.title}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {rightActionText && onRightActionPress ? (
        <Pressable
          onPress={onRightActionPress}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={rightActionText}
        >
          <Text variant="secondary" style={styles.actionText}>
            {rightActionText}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xs,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
});
