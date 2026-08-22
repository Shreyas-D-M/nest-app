import { palette } from './palette';

/**
 * Semantic colour tokens.
 *
 * Components reference roles ("surface", "textPrimary") rather than brand names
 * ("cream", "ink"). The design system specifies a mostly light interface with
 * dark ink text and restrained green accents — colour is used sparingly.
 *
 * A dark scheme is intentionally not defined yet: it is a design deliverable,
 * and inventing one here would produce values nobody approved. The shape below
 * is what a second scheme will implement.
 */

export interface ColorScheme {
  /** App background. */
  background: string;
  /** Raised surfaces such as cards and sheets. */
  surface: string;
  /** Recessed or muted surface for secondary buttons and fills. */
  surfaceMuted: string;

  textPrimary: string;
  textSecondary: string;
  /** Text placed on top of a dark or accent-filled surface. */
  textInverse: string;

  border: string;

  /** Primary action fill — dark ink, per the button spec. */
  actionPrimary: string;
  actionPrimaryText: string;
  /** Secondary action fill — light neutral surface. */
  actionSecondary: string;
  actionSecondaryText: string;
  /** Forest accent, used for success-flavoured actions. */
  accent: string;
  accentText: string;

  success: string;
  warning: string;
  danger: string;
  info: string;
}

export const lightColors: ColorScheme = {
  background: palette.cream,
  surface: palette.white,
  surfaceMuted: palette.sage,

  textPrimary: palette.ink,
  textSecondary: palette.textSecondary,
  textInverse: palette.white,

  border: palette.border,

  actionPrimary: palette.ink,
  actionPrimaryText: palette.white,
  actionSecondary: palette.sage,
  actionSecondaryText: palette.ink,
  accent: palette.forest,
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
