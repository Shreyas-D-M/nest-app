import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import type { TypographyToken } from '@nest/tokens';
import { useTheme, type Theme } from './theme';
import type { ReactElement } from 'react';

/** Semantic text colour roles. Components never name a brand colour directly. */
export type TextColorRole =
  'primary' | 'secondary' | 'inverse' | 'accent' | 'success' | 'warning' | 'danger' | 'info';

function resolveColor(theme: Theme, role: TextColorRole): string {
  switch (role) {
    case 'primary':
      return theme.colors.textPrimary;
    case 'secondary':
      return theme.colors.textSecondary;
    case 'inverse':
      return theme.colors.textInverse;
    case 'accent':
      return theme.colors.accent;
    case 'success':
      return theme.colors.success;
    case 'warning':
      return theme.colors.warning;
    case 'danger':
      return theme.colors.danger;
    case 'info':
      return theme.colors.info;
  }
}

export interface TextProps extends RNTextProps {
  variant?: TypographyToken;
  color?: TextColorRole;
}

/**
 * Typed text primitive.
 *
 * `allowFontScaling` is left on so the app honours the OS text-size setting —
 * dynamic text support is an accessibility requirement of the design system.
 */
export function Text({
  variant = 'body',
  color = 'primary',
  style,
  ...rest
}: TextProps): ReactElement {
  const theme = useTheme();
  const token = theme.typography[variant];

  const resolved: TextStyle = {
    fontSize: token.fontSize,
    lineHeight: token.lineHeight,
    fontWeight: token.fontWeight,
    color: resolveColor(theme, color),
  };

  return <RNText allowFontScaling style={[resolved, style]} {...rest} />;
}
