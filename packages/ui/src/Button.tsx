import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { MIN_TOUCH_TARGET } from '@nest/tokens';
import { Text } from './Text';
import { useTheme, type Theme } from './theme';
import type { ReactElement } from 'react';

/**
 * Button variants follow 04_DESIGN_SYSTEM.md:
 *   primary   — dark ink background, white text
 *   secondary — light neutral surface
 *   accent    — forest, for success-flavoured actions
 *   danger    — reserved strictly for destructive actions
 */
export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'danger';

interface VariantStyle {
  background: string;
  pressedBackground: string;
  textColor: 'primary' | 'inverse';
  borderColor?: string;
}

function resolveVariant(theme: Theme, variant: ButtonVariant): VariantStyle {
  switch (variant) {
    case 'primary':
      return {
        background: theme.colors.actionPrimary,
        pressedBackground: theme.colors.accent,
        textColor: 'inverse',
      };
    case 'secondary':
      return {
        background: theme.colors.actionSecondary,
        pressedBackground: theme.colors.border,
        textColor: 'primary',
        borderColor: theme.colors.border,
      };
    case 'accent':
      return {
        background: theme.colors.accent,
        pressedBackground: theme.colors.actionPrimary,
        textColor: 'inverse',
      };
    case 'danger':
      return {
        background: theme.colors.danger,
        pressedBackground: theme.colors.actionPrimary,
        textColor: 'inverse',
      };
  }
}

export interface ButtonProps {
  /**
   * Visible label. Required — an icon-only button would fail the design
   * system's rule that icons carry labels where meaning is not obvious.
   *
   * Pass an already-translated string; components do not call the translator
   * themselves so that they stay presentational.
   */
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  /** Extra context for screen readers when the label alone is ambiguous. */
  accessibilityHint?: string;
  testID?: string;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  accessibilityHint,
  testID,
}: ButtonProps): ReactElement {
  const theme = useTheme();
  const variantStyle = resolveVariant(theme, variant);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }): ViewStyle => ({
        minHeight: MIN_TOUCH_TARGET,
        justifyContent: 'center',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        borderWidth: variantStyle.borderColor === undefined ? 0 : StyleSheet.hairlineWidth,
        borderColor: variantStyle.borderColor,
        backgroundColor: pressed ? variantStyle.pressedBackground : variantStyle.background,
        opacity: disabled ? 0.5 : 1,
      })}
    >
      <View pointerEvents="none">
        <Text variant="bodyStrong" color={variantStyle.textColor} style={styles.label}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {
    textAlign: 'center',
  },
});
