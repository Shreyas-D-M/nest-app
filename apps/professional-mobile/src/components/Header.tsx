import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@nest/ui';
import type { ReactElement, ReactNode } from 'react';
import { colors, radius, spacing } from '../theme/colors';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  caption?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: ReactNode;
}

export function Header({
  title,
  subtitle,
  caption,
  showBack = false,
  onBack,
  rightElement,
}: HeaderProps): ReactElement {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        {showBack ? (
          <Pressable
            onPress={handleBack}
            style={styles.backButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={18} color={colors.text} />
          </Pressable>
        ) : null}

        <View style={styles.textWrap}>
          {caption ? (
            <Text variant="caption" style={styles.caption}>
              {caption}
            </Text>
          ) : null}
          <Text variant="h1" style={styles.title}>
            {title}
          </Text>
        </View>

        {rightElement ? <View style={styles.rightWrap}>{rightElement}</View> : null}
      </View>

      {subtitle ? (
        <Text variant="body" style={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.xs,
    gap: 2,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  textWrap: {
    flex: 1,
  },
  caption: {
    letterSpacing: 0.6,
    fontWeight: '600',
    color: colors.primary,
    fontSize: 11,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rightWrap: {
    alignItems: 'flex-end',
  },
});
