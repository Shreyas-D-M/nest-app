/**
 * Corner radius scale.
 *
 * The design system warns against excessive rounded rectangles — shape should
 * be used intentionally, so the scale is deliberately short.
 */

export const radius = {
  none: 0,
  sm: 10,
  md: 16,
  lg: 24,
  pill: 999,
} as const;

export type RadiusToken = keyof typeof radius;
