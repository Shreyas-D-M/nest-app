/**
 * English message catalogue.
 *
 * Keys are flat and dotted. Every user-visible string in the clients must come
 * from here — 04_DESIGN_SYSTEM.md requires strings to stay externalisable, and
 * the PRD adds Kannada/Hindi/Hinglish in P1.
 *
 * Interpolation uses `{name}` placeholders.
 */
export const en = {
  'app.name': 'NEST',
  'app.tagline': "Your city's trusted service network.",

  'common.retry': 'Try again',
  'common.cancel': 'Cancel',
  'common.close': 'Close',
  'common.ok': 'OK',
  'common.loading': 'Loading…',

  'error.generic': 'Something went wrong. Please try again.',
  'error.offline': 'You appear to be offline. Check your connection and try again.',

  'foundation.heading': 'Foundation build',
  'foundation.customerApp': 'Customer app',
  'foundation.professionalApp': 'Professional app',
  'foundation.body': 'The workspace is configured. Product screens are not implemented yet.',
  'foundation.apiTarget': 'API target: {url}',
  'foundation.checkApi': 'Check API connection',
  'foundation.apiReachable': 'API reachable — {service} v{version}',
  'foundation.apiUnreachable': 'Could not reach the API. Is it running?',
} as const;

export type MessageKey = keyof typeof en;
