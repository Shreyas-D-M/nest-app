import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement, ReactNode } from 'react';
import { colors, shadows, spacing } from '../theme/colors';

export interface HeaderProps {
  title: string;
  caption?: string;
  subtitle?: string;
  onBack?: () => void;
  backHref?: string;
  rightAction?: ReactNode;
  showBack?: boolean;
}

export function Header({
  title,
  caption,
  subtitle,
  onBack,
  backHref,
  rightAction,
  showBack = true,
}: HeaderProps): ReactElement {
  const handleBack = (): void => {
    if (onBack) {
      onBack();
    } else if (backHref) {
      router.replace(backHref as never);
    } else {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={styles.backBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
        ) : null}

        <View style={styles.titleWrap}>
          {caption ? (
            <Text variant="caption" style={styles.caption}>
              {caption.toUpperCase()}
            </Text>
          ) : null}
          <Text variant="h1" style={styles.title}>
            {title}
          </Text>
        </View>

        {rightAction ? (
          <View style={styles.rightWrap}>{rightAction}</View>
        ) : showBack ? (
          <View style={styles.placeholder} />
        ) : null}
      </View>

      {subtitle ? (
        <Text variant="secondary" color="secondary" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  titleWrap: {
    flex: 1,
    gap: 1,
  },
  caption: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    color: colors.primary,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightWrap: {
    minWidth: 44,
    alignItems: 'flex-end',
  },
  placeholder: {
    width: 44,
  },
});
