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
  'common.now': 'Now',
  'common.today': 'Today',
  'common.eta': 'ETA',

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

  'customer.home.greeting': 'Good evening',
  'customer.home.title': 'What do you need help with?',
  'customer.home.subtitle': 'Trusted local help in Belagavi.',
  'customer.home.problemPrompt': 'Tell us what happened',
  'customer.home.problemPlaceholder':
    'Leaking kitchen tap, AC not cooling, garage light flickering…',
  'customer.home.findHelp': 'Find help',
  'customer.home.quickCategories': 'Quick categories',
  'customer.home.availableNow': 'Available now',
  'customer.home.yourPeople': 'Your People',
  'customer.home.homePassport': 'Home Passport',
  'customer.home.bookAgain': 'Book again',
  'customer.home.viewAll': 'View all',
  'customer.home.problemOne': 'Plumbing',
  'customer.home.problemTwo': 'Electrical',
  'customer.home.problemThree': 'AC repair',
  'customer.home.problemFour': 'Cleaning',
  'customer.home.recommended': 'Recommended',
  'customer.home.distance': '1.6 km away',
  'customer.home.estimate': 'From ₹499',
  'customer.home.availability': 'Available in 35 min',
  'customer.home.passportDue': 'Next maintenance',
  'customer.home.passportText': 'Water purifier filter due in 9 days',

  'professional.home.title': 'What do I need to do now?',
  'professional.home.online': 'Online and taking jobs',
  'professional.home.nextJob': 'Next job',
  'professional.home.jobTime': 'Starts in 25 min',
  'professional.home.jobAddress': '3rd Cross, Sadashiv Nagar',
  'professional.home.accept': 'View job',
  'professional.home.jobsToday': 'Jobs today',
  'professional.home.earnings': 'Earnings',
  'professional.home.responseRate': 'Response rate',
  'professional.home.queue': 'Job queue',
  'professional.home.earningsValue': '₹8,450',
  'professional.home.responseValue': '96%',

  'admin.dashboard.title': 'NEST Admin',
  'admin.dashboard.subtitle': 'Operations overview',
  'admin.dashboard.metrics.title': 'Overview',
  'admin.dashboard.pendingVerifications': 'Pending verifications',
  'admin.dashboard.jobsToday': 'Jobs today',
  'admin.dashboard.payouts': 'Payouts due',
  'admin.dashboard.refunds': 'Open disputes',
  'admin.dashboard.verificationQueue': 'Verification queue',
  'admin.dashboard.liveBookings': 'Live bookings',
  'admin.dashboard.supportQueue': 'Support queue',
  'admin.dashboard.viewAll': 'View all',
  'admin.dashboard.approve': 'Approve',
  'admin.dashboard.review': 'Review',
  'admin.dashboard.priority': 'Priority',
  'admin.dashboard.status': 'Status',
} as const;

export type MessageKey = keyof typeof en;
