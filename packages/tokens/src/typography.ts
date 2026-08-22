/**
 * Typography scale for mobile surfaces.
 *
 * Sizes are the midpoints of the ranges given in 04_DESIGN_SYSTEM.md. Line
 * heights are absolute rather than multipliers because React Native's
 * `lineHeight` expects points.
 *
 * Font family resolves to the platform system face for now: `System` gives
 * SF Pro on Apple platforms and Roboto on Android, which matches the specified
 * intent. Inter is the brand face and will be substituted here once it is
 * bundled as a loaded font asset — naming it before then would render nothing.
 */

export const FONT_FAMILY = {
  base: 'System',
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
} as const;

export type FontWeightToken = keyof typeof fontWeight;

export interface TextStyleToken {
  fontSize: number;
  lineHeight: number;
  fontWeight: (typeof fontWeight)[FontWeightToken];
}

export const typography = {
  display: { fontSize: 32, lineHeight: 38, fontWeight: fontWeight.semibold },
  h1: { fontSize: 26, lineHeight: 32, fontWeight: fontWeight.semibold },
  h2: { fontSize: 21, lineHeight: 28, fontWeight: fontWeight.semibold },
  body: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.regular },
  bodyStrong: { fontSize: 16, lineHeight: 24, fontWeight: fontWeight.semibold },
  secondary: { fontSize: 14, lineHeight: 20, fontWeight: fontWeight.regular },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: fontWeight.regular },
} as const satisfies Record<string, TextStyleToken>;

export type TypographyToken = keyof typeof typography;
