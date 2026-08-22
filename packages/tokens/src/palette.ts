/**
 * Raw brand palette — the literal hex values from 04_DESIGN_SYSTEM.md.
 *
 * Components must NOT import from this file. Import the semantic tokens in
 * `color.ts` instead, so that the palette can change without rewriting
 * components (an explicit requirement of the design system).
 */

export const palette = {
  ink: '#101614',
  forest: '#123B32',
  sage: '#DCE8E1',
  cream: '#F7F5EF',
  white: '#FFFFFF',

  textSecondary: '#65716C',
  border: '#E4E8E5',

  success: '#237A55',
  warning: '#B7791F',
  danger: '#C44536',
  info: '#3B6EA8',
} as const;

export type PaletteColor = keyof typeof palette;
