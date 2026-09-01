/**
 * Premium customer marketplace palette.
 */

export const palette = {
  indigo: '#4F46E5',
  deepIndigo: '#3730A3',
  violet: '#7C3AED',
  coral: '#F97360',
  lavenderBg: '#F7F7FF',
  lavenderSurface: '#EEF0FF',
  white: '#FFFFFF',
  textPrimary: '#17172B',
  textSecondary: '#66667A',
  border: '#E1E3F0',
  success: '#16A34A',
  danger: '#DC2626',
  info: '#3B82F6',
  warning: '#F59E0B',
} as const;

export type PaletteColor = keyof typeof palette;
