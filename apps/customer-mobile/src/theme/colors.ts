/**
 * NEST Customer Mobile Design System
 * Curated tokens for a premium Indian home-services marketplace.
 */

export const colors = {
  // Background & Surfaces
  background: '#F7F8FC',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  elevatedSurface: '#FFFFFF',
  surfaceMuted: '#F3F4F6',
  surfaceSubtle: '#F9FAFB',

  // Primary Brand (NEST Indigo)
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryPressed: '#3730A3',
  primaryLight: '#EEF2FF',
  primarySubtle: '#F5F7FF',
  primaryBorder: '#C7D2FE',

  // Semantic States
  success: '#10B981',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#047857',

  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FCA5A5',
  dangerText: '#DC2626',

  // Typography
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  divider: '#E5E7EB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
} as const;

export const typography = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' as const, color: colors.text },
  screenTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700' as const, color: colors.text },
  sectionTitle: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, color: colors.text },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, color: colors.textSecondary },
  badge: { fontSize: 10, lineHeight: 14, fontWeight: '700' as const },
  price: { fontSize: 16, lineHeight: 22, fontWeight: '700' as const, color: colors.text },
} as const;
