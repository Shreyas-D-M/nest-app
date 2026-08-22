/**
 * Spacing scale.
 *
 * Base unit is 4 px. The named steps are the common values called out in
 * 04_DESIGN_SYSTEM.md; use them rather than arbitrary numbers so that rhythm
 * stays consistent across screens.
 */

export const SPACING_BASE = 4;

export const spacing = {
  none: 0,
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export type SpacingToken = keyof typeof spacing;
