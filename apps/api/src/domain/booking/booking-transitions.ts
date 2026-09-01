import type { ActorType, BookingStatus } from '@nest/types';

/**
 * Booking state machine.
 *
 * Framework-free and pure, per the contract in `src/domain/README.md`: booking
 * lifecycle rules are core business logic that CLAUDE.md requires the server to
 * own and to cover with tests.
 *
 * Legal transitions derived from 06_API_SPEC.md booking flow:
 *
 *   REQUESTED       → ACCEPTED | CANCELLED_BY_CUSTOMER | CANCELLED_BY_ADMIN
 *   ACCEPTED        → ARRIVING | CANCELLED_BY_PROFESSIONAL | CANCELLED_BY_ADMIN
 *   ARRIVING        → ARRIVED | CANCELLED_BY_PROFESSIONAL | CANCELLED_BY_ADMIN
 *   ARRIVED         → IN_PROGRESS | CANCELLED_BY_PROFESSIONAL | CANCELLED_BY_ADMIN
 *   IN_PROGRESS     → EXTRA_APPROVAL_PENDING | COMPLETED | CANCELLED_BY_ADMIN
 *   EXTRA_APPROVAL_PENDING → IN_PROGRESS | COMPLETED | CANCELLED_BY_ADMIN
 *   COMPLETED       → PAYMENT_PENDING
 *   PAYMENT_PENDING → PAID
 *   PAID            → REVIEWED
 *   REVIEWED        → [terminal]
 *   CANCELLED_*     → [terminal]
 *
 * Actor permissions:
 *   - CUSTOMER can: cancel from REQUESTED
 *   - PROFESSIONAL can: accept from REQUESTED, advance through job states,
 *     propose extra work, complete, cancel before work starts
 *   - ADMIN can: cancel from any pre-completion state
 *   - SYSTEM can: advance payment states (webhook callbacks)
 */

const LEGAL_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  REQUESTED: ['ACCEPTED', 'CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_ADMIN'],
  ACCEPTED: ['ARRIVING', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN'],
  ARRIVING: ['ARRIVED', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN'],
  ARRIVED: ['IN_PROGRESS', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN'],
  IN_PROGRESS: ['EXTRA_APPROVAL_PENDING', 'COMPLETED', 'CANCELLED_BY_ADMIN'],
  EXTRA_APPROVAL_PENDING: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED_BY_ADMIN'],
  COMPLETED: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PAID'],
  PAID: ['REVIEWED'],
  REVIEWED: [],
  CANCELLED_BY_CUSTOMER: [],
  CANCELLED_BY_PROFESSIONAL: [],
  CANCELLED_BY_ADMIN: [],
};

/**
 * Actor-specific permissions for state transitions.
 *
 * Maps (from_status, to_status) → allowed actor types.
 */
const ACTOR_PERMISSIONS: ReadonlyMap<string, readonly ActorType[]> = new Map([
  // Customer can only cancel from REQUESTED
  ['REQUESTED→CANCELLED_BY_CUSTOMER', ['CUSTOMER']],

  // Professional drives the job workflow
  ['REQUESTED→ACCEPTED', ['PROFESSIONAL']],
  ['ACCEPTED→ARRIVING', ['PROFESSIONAL']],
  ['ARRIVING→ARRIVED', ['PROFESSIONAL']],
  ['ARRIVED→IN_PROGRESS', ['PROFESSIONAL']],
  ['IN_PROGRESS→EXTRA_APPROVAL_PENDING', ['PROFESSIONAL']],
  ['IN_PROGRESS→COMPLETED', ['PROFESSIONAL']],

  // Customer approves or rejects extra work
  ['EXTRA_APPROVAL_PENDING→IN_PROGRESS', ['CUSTOMER']], // reject
  ['EXTRA_APPROVAL_PENDING→COMPLETED', ['CUSTOMER']], // approve

  // Professional can cancel before work starts
  ['ACCEPTED→CANCELLED_BY_PROFESSIONAL', ['PROFESSIONAL']],
  ['ARRIVING→CANCELLED_BY_PROFESSIONAL', ['PROFESSIONAL']],
  ['ARRIVED→CANCELLED_BY_PROFESSIONAL', ['PROFESSIONAL']],

  // Admin can force-cancel pre-completion states
  ['REQUESTED→CANCELLED_BY_ADMIN', ['ADMIN']],
  ['ACCEPTED→CANCELLED_BY_ADMIN', ['ADMIN']],
  ['ARRIVING→CANCELLED_BY_ADMIN', ['ADMIN']],
  ['ARRIVED→CANCELLED_BY_ADMIN', ['ADMIN']],
  ['IN_PROGRESS→CANCELLED_BY_ADMIN', ['ADMIN']],
  ['EXTRA_APPROVAL_PENDING→CANCELLED_BY_ADMIN', ['ADMIN']],

  // System advances payment states (webhook callbacks)
  ['COMPLETED→PAYMENT_PENDING', ['SYSTEM', 'ADMIN']],
  ['PAYMENT_PENDING→PAID', ['SYSTEM', 'ADMIN']],

  // Customer submits review after payment
  ['PAID→REVIEWED', ['CUSTOMER']],
]);

/**
 * Checks if a transition is legal and the actor has permission.
 *
 * @returns true if the transition is allowed for this actor
 */
export function canTransition(from: BookingStatus, to: BookingStatus, actor: ActorType): boolean {
  // First check if the transition exists in the state machine
  if (!LEGAL_TRANSITIONS[from].includes(to)) {
    return false;
  }

  // Check actor permission for this specific transition
  const key = `${from}→${to}`;
  const allowedActors = ACTOR_PERMISSIONS.get(key);

  // If no explicit permission rule, deny by default
  if (allowedActors === undefined) {
    return false;
  }

  return allowedActors.includes(actor);
}

/**
 * Returns all legal next states for a given status and actor.
 *
 * Filters the state machine transitions by what this actor is permitted to do.
 */
export function legalTransitionsFrom(
  from: BookingStatus,
  actor: ActorType,
): readonly BookingStatus[] {
  const allTransitions = LEGAL_TRANSITIONS[from];

  return allTransitions.filter((to) => canTransition(from, to, actor));
}

// ---------------------------------------------------------------------------
// Guard functions
// ---------------------------------------------------------------------------

/**
 * Whether a booking can be cancelled.
 *
 * Cancellation is not possible once work is in progress or completed.
 */
export function canBeCancelled(status: BookingStatus): boolean {
  return (
    status === 'REQUESTED' ||
    status === 'ACCEPTED' ||
    status === 'ARRIVING' ||
    status === 'ARRIVED' ||
    status === 'IN_PROGRESS' ||
    status === 'EXTRA_APPROVAL_PENDING'
  );
}

/**
 * Whether a booking is awaiting payment.
 */
export function isAwaitingPayment(status: BookingStatus): boolean {
  return status === 'PAYMENT_PENDING';
}

/**
 * Whether work on a booking is complete.
 *
 * Completed means the professional has finished; payment and review may still
 * be pending.
 */
export function isComplete(status: BookingStatus): boolean {
  return (
    status === 'COMPLETED' ||
    status === 'PAYMENT_PENDING' ||
    status === 'PAID' ||
    status === 'REVIEWED'
  );
}

/**
 * Whether the booking requires customer action.
 */
export function requiresCustomerAction(status: BookingStatus): boolean {
  return status === 'EXTRA_APPROVAL_PENDING' || status === 'PAYMENT_PENDING';
}

/**
 * Whether the booking has reached a terminal state.
 */
export function isTerminal(status: BookingStatus): boolean {
  return (
    status === 'REVIEWED' ||
    status === 'CANCELLED_BY_CUSTOMER' ||
    status === 'CANCELLED_BY_PROFESSIONAL' ||
    status === 'CANCELLED_BY_ADMIN'
  );
}

/**
 * Whether the booking is in a cancelled state.
 */
export function isCancelled(status: BookingStatus): boolean {
  return (
    status === 'CANCELLED_BY_CUSTOMER' ||
    status === 'CANCELLED_BY_PROFESSIONAL' ||
    status === 'CANCELLED_BY_ADMIN'
  );
}

/**
 * Whether the professional can propose extra work.
 *
 * Extra work can only be proposed while work is in progress.
 */
export function canProposeExtraWork(status: BookingStatus): boolean {
  return status === 'IN_PROGRESS';
}

/**
 * Whether a review can be submitted for this booking.
 */
export function canBeReviewed(status: BookingStatus): boolean {
  return status === 'PAID';
}
