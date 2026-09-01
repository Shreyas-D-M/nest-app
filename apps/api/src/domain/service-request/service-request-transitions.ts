import type { ServiceRequestStatus } from '@nest/types';

/**
 * Service request state machine.
 *
 * Framework-free and pure. Service requests have a simpler lifecycle than
 * bookings: mostly linear from draft to matched, with AI assistance in between.
 *
 * Legal transitions:
 *
 *   DRAFT       → CLARIFYING | READY | CANCELLED
 *   CLARIFYING  → READY | CANCELLED
 *   READY       → MATCHED | CANCELLED
 *   MATCHED     → [terminal]
 *   CANCELLED   → [terminal]
 *
 * CLARIFYING indicates the AI needs more information from the customer.
 * READY means the request is classified and ready for professional matching.
 * MATCHED means a booking was created from this request.
 */

const LEGAL_TRANSITIONS: Readonly<Record<ServiceRequestStatus, readonly ServiceRequestStatus[]>> = {
  DRAFT: ['CLARIFYING', 'READY', 'CANCELLED'],
  CLARIFYING: ['READY', 'CANCELLED'],
  READY: ['MATCHED', 'CANCELLED'],
  MATCHED: [],
  CANCELLED: [],
};

/**
 * Checks if a transition from one status to another is legal.
 */
export function canTransition(from: ServiceRequestStatus, to: ServiceRequestStatus): boolean {
  return LEGAL_TRANSITIONS[from].includes(to);
}

/**
 * Returns all legal next states for a given status.
 */
export function legalTransitionsFrom(from: ServiceRequestStatus): readonly ServiceRequestStatus[] {
  return LEGAL_TRANSITIONS[from];
}

// ---------------------------------------------------------------------------
// Guard functions
// ---------------------------------------------------------------------------

/**
 * Whether the request is ready for matching with a professional.
 */
export function isReadyForMatching(status: ServiceRequestStatus): boolean {
  return status === 'READY';
}

/**
 * Whether the request needs customer clarification.
 */
export function needsClarification(status: ServiceRequestStatus): boolean {
  return status === 'CLARIFYING';
}

/**
 * Whether the request has reached a terminal state.
 */
export function isTerminal(status: ServiceRequestStatus): boolean {
  return status === 'MATCHED' || status === 'CANCELLED';
}

/**
 * Whether a request can be cancelled.
 */
export function canBeCancelled(status: ServiceRequestStatus): boolean {
  return status !== 'MATCHED' && status !== 'CANCELLED';
}

/**
 * Whether a request has been converted to a booking.
 */
export function isMatched(status: ServiceRequestStatus): boolean {
  return status === 'MATCHED';
}
