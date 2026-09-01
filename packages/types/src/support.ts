/**
 * Support ticket types, enums, and error codes.
 *
 * Covers customer and professional support requests with routing and SLA tracking.
 */

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

export const TICKET_TYPES = [
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'QUALITY_COMPLAINT',
  'SAFETY_CONCERN',
  'ACCOUNT_ISSUE',
  'OTHER',
] as const;

export type TicketType = (typeof TICKET_TYPES)[number];

export const TICKET_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export type TicketPriority = (typeof TICKET_PRIORITIES)[number];

export const TICKET_STATUSES = [
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
] as const;

export type TicketStatus = (typeof TICKET_STATUSES)[number];

// ---------------------------------------------------------------------------
// Error codes
// ---------------------------------------------------------------------------

export const SUPPORT_ERROR_CODES = {
  NOT_FOUND: 'support:not_found',
  NOT_AUTHORIZED: 'support:not_authorized',
  INVALID_STATUS_TRANSITION: 'support:invalid_status_transition',
  ALREADY_RESOLVED: 'support:already_resolved',
} as const;

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

/**
 * A support ticket raised by a customer or professional.
 */
export interface SupportTicket {
  id: string;
  requesterId: string;
  bookingId: string | null;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  assignedAdminId: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
}

/**
 * List item view for tickets.
 */
export interface TicketListItem {
  id: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  bookingId: string | null;
  createdAt: Date;
  requester: {
    id: string;
    name: string | null;
    phone: string;
  };
}

/**
 * Admin's detailed view of a ticket.
 */
export interface AdminTicketView {
  id: string;
  type: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  requester: {
    id: string;
    name: string | null;
    phone: string;
    email: string | null;
  };
  booking: {
    id: string;
    status: string;
    scheduledStart: Date;
    service: {
      name: string;
    };
  } | null;
  assignedAdmin: {
    id: string;
    name: string | null;
  } | null;
}
