import type { VerificationStatus } from '@nest/types';

/**
 * Professional verification state machine.
 *
 * Framework-free and pure, per the contract in `src/domain/README.md`: the rules
 * about who may be called verified are the kind of logic CLAUDE.md requires the
 * server to own and to cover with tests.
 *
 * Legal transitions, derived from the admin actions in 06_API_SPEC.md:
 *
 *   UNSUBMITTED       → PENDING_REVIEW                 (professional submits)
 *   PENDING_REVIEW    → APPROVED | REJECTED
 *                     | CHANGES_REQUESTED              (admin decides)
 *   CHANGES_REQUESTED → PENDING_REVIEW                 (professional resubmits)
 *   REJECTED          → PENDING_REVIEW                 (professional reapplies)
 *   APPROVED          → REJECTED                       (admin revokes)
 *
 * Notably absent: nothing reaches APPROVED except an explicit admin decision from
 * PENDING_REVIEW. There is no path that approves a professional as a side effect.
 */

const LEGAL_TRANSITIONS: Readonly<Record<VerificationStatus, readonly VerificationStatus[]>> = {
  UNSUBMITTED: ['PENDING_REVIEW'],
  PENDING_REVIEW: ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'],
  CHANGES_REQUESTED: ['PENDING_REVIEW'],
  APPROVED: ['REJECTED'],
  REJECTED: ['PENDING_REVIEW'],
};

export function canTransition(from: VerificationStatus, to: VerificationStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

export function legalTransitionsFrom(
  from: VerificationStatus,
): readonly VerificationStatus[] {
  return LEGAL_TRANSITIONS[from];
}

/**
 * The single definition of "verified".
 *
 * CLAUDE.md forbids claiming verification unless the verification step is
 * complete. Everything that could imply verification — a public listing, a badge,
 * going online — must route through this function rather than comparing statuses
 * itself, so the rule cannot drift apart in five places.
 */
export function isVerified(status: VerificationStatus): boolean {
  return status === 'APPROVED';
}

/**
 * Whether a professional may appear to customers.
 *
 * Identical to `isVerified` today. It exists as its own function because the two
 * questions are genuinely different — visibility could later require more than
 * verification (an active service, a covered area) — and conflating them is how
 * an unverified professional eventually leaks into a listing.
 */
export function isPubliclyVisible(status: VerificationStatus): boolean {
  return isVerified(status);
}

/** Whether a professional may accept work. Requires completed verification. */
export function canGoOnline(status: VerificationStatus): boolean {
  return isVerified(status);
}
