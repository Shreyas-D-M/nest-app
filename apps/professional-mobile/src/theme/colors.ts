/**
 * NEST Professional Mobile Design System Tokens
 * Clean, operational, trustworthy supply-side tokens sharing NEST's brand identity.
 */

export const colors = {
  // Background & Surfaces
  background: '#F8FAFC',
  card: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceSecondary: '#F1F5F9',
  surfaceSubtle: '#F8FAFC',
  surfaceMuted: '#F1F5F9',
  elevatedSurface: '#FFFFFF',

  // Primary Brand (NEST Indigo)
  primary: '#4F46E5',
  primaryDark: '#3730A3',
  primaryPressed: '#3730A3',
  primaryLight: '#EEF2FF',
  primarySubtle: '#F5F7FF',
  primaryBorder: '#C7D2FE',

  // Semantic States
  success: '#059669',
  successLight: '#ECFDF5',
  successBorder: '#A7F3D0',
  successText: '#047857',

  warning: '#D97706',
  warningLight: '#FEF3C7',
  warningBorder: '#FDE68A',
  warningText: '#92400E',

  danger: '#DC2626',
  dangerLight: '#FEF2F2',
  dangerBorder: '#FECACA',
  dangerText: '#B91C1C',

  // Supply-Side Statuses
  online: '#059669',
  onlineLight: '#ECFDF5',
  onlineBorder: '#A7F3D0',
  offline: '#64748B',
  offlineLight: '#F1F5F9',
  offlineBorder: '#E2E8F0',
  busy: '#D97706',
  busyLight: '#FEF3C7',

  // Typography
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  // Borders & Dividers
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  divider: '#F1F5F9',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  lg: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
} as const;

export const typography = {
  screenTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700' as const, color: colors.text },
  sectionTitle: { fontSize: 18, lineHeight: 24, fontWeight: '600' as const, color: colors.text },
  cardTitle: { fontSize: 15, lineHeight: 20, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 14, lineHeight: 20, fontWeight: '400' as const, color: colors.text },
  bodyStrong: { fontSize: 14, lineHeight: 20, fontWeight: '600' as const, color: colors.text },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' as const, color: colors.textSecondary },
  tiny: { fontSize: 11, lineHeight: 14, fontWeight: '500' as const, color: colors.textMuted },
} as const;
