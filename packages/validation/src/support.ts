import { z } from 'zod';
import { TICKET_TYPES, TICKET_PRIORITIES, TICKET_STATUSES } from '@nest/types';
import { boundedTextSchema, uuidSchema } from './primitives';

/**
 * Support ticket validation schemas.
 *
 * Field lengths mirror database column widths.
 */

export const ticketTypeSchema = z.enum(TICKET_TYPES);
export const ticketPrioritySchema = z.enum(TICKET_PRIORITIES);
export const ticketStatusSchema = z.enum(TICKET_STATUSES);

/**
 * `POST /support/tickets` — create a support ticket.
 *
 * Type is mandatory for routing. Booking ID is optional: not every ticket is
 * booking-specific (e.g., account issues). Description must be detailed enough
 * for support to understand the issue.
 */
export const supportTicketCreateSchema = z.object({
  type: ticketTypeSchema,
  bookingId: uuidSchema.optional(),
  description: boundedTextSchema(20, 5000),
});

export type SupportTicketCreateInput = z.infer<typeof supportTicketCreateSchema>;

/**
 * `GET /support/tickets` — list requester's tickets.
 */
export const supportTicketListQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  type: ticketTypeSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type SupportTicketListQueryInput = z.infer<typeof supportTicketListQuerySchema>;

/**
 * `GET /admin/support` — list all tickets with admin filters.
 */
export const adminSupportTicketListQuerySchema = z.object({
  status: ticketStatusSchema.optional(),
  type: ticketTypeSchema.optional(),
  priority: ticketPrioritySchema.optional(),
  assignedAdminId: uuidSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type AdminSupportTicketListQueryInput = z.infer<typeof adminSupportTicketListQuerySchema>;

/**
 * `PATCH /admin/support/:id` — update ticket status or assignment.
 */
export const adminSupportTicketUpdateSchema = z
  .object({
    status: ticketStatusSchema.optional(),
    priority: ticketPrioritySchema.optional(),
    assignedAdminId: uuidSchema.nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'Provide at least one field to update',
  });

export type AdminSupportTicketUpdateInput = z.infer<typeof adminSupportTicketUpdateSchema>;
