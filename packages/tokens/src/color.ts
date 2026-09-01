import { palette } from './palette';

/**
 * Semantic colour tokens.
 */

export interface ColorScheme {
  background: string;
  surface: string;
  surfaceMuted: string;

  textPrimary: string;
  textSecondary: string;
  textInverse: string;

  border: string;

  actionPrimary: string;
  actionPrimaryText: string;
  actionSecondary: string;
  actionSecondaryText: string;
  accent: string;
  accentText: string;

  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const lightColors: ColorScheme = {
  background: palette.lavenderBg,
  surface: palette.white,
  surfaceMuted: palette.lavenderSurface,

  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
  textInverse: palette.white,

  border: palette.border,

  actionPrimary: palette.indigo,
  actionPrimaryText: palette.white,
  actionSecondary: palette.lavenderSurface,
  actionSecondaryText: palette.violet,
  accent: palette.coral,
  accentText: palette.white,

  success: palette.success,
  warning: palette.warning,
  danger: palette.danger,
  info: palette.info,
};

export const colorSchemes = {
  light: lightColors,
} as const;

export type ColorSchemeName = keyof typeof colorSchemes;
