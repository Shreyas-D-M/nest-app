import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// Schema enums match Prisma schema
export const SupportCategorySchema = z.enum([
  'BOOKING_ISSUE',
  'PAYMENT_ISSUE',
  'QUALITY_COMPLAINT',
  'SAFETY_CONCERN',
  'ACCOUNT_ISSUE',
  'OTHER',
]);

export const TicketStatusSchema = z.enum([
  'OPEN',
  'IN_PROGRESS',
  'WAITING_CUSTOMER',
  'WAITING_INTERNAL',
  'RESOLVED',
  'CLOSED',
]);

export const TicketPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const CreateTicketDtoSchema = z.object({
  bookingId: z.string().uuid().optional(),
  category: SupportCategorySchema,
  subject: z.string().min(5).max(200),
  description: z.string().min(20).max(5000),
  priority: TicketPrioritySchema.default('MEDIUM'),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const UpdateTicketDtoSchema = z.object({
  status: TicketStatusSchema.optional(),
  priority: TicketPrioritySchema.optional(),
  assignedToId: z.string().uuid().optional(),
});

export const AddMessageDtoSchema = z.object({
  ticketId: z.string().uuid(),
  body: z.string().min(1).max(5000),
  attachments: z.array(z.string().url()).max(5).optional(),
  isInternal: z.boolean().default(false),
});

export const TicketMessageResponseDtoSchema = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  authorId: z.string().uuid(),
  authorRole: z.enum(['CUSTOMER', 'PROFESSIONAL', 'ADMIN', 'SYSTEM']),
  body: z.string(),
  attachments: z.array(z.string().url()),
  isInternal: z.boolean(),
  createdAt: z.date(),
});

export const TicketResponseDtoSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid(),
  bookingId: z.string().uuid().nullable(),
  category: SupportCategorySchema,
  subject: z.string(),
  description: z.string(),
  status: TicketStatusSchema,
  priority: TicketPrioritySchema,
  assignedToId: z.string().uuid().nullable(),
  attachments: z.array(z.string().url()),
  createdAt: z.date(),
  updatedAt: z.date(),
  closedAt: z.date().nullable(),
  messages: z.array(TicketMessageResponseDtoSchema),
  customer: z
    .object({
      id: z.string().uuid(),
      name: z.string().nullable(),
      phone: z.string(),
    })
    .optional(),
  assignedTo: z
    .object({
      id: z.string().uuid(),
      name: z.string().nullable(),
    })
    .optional(),
});

export const TicketListQuerySchema = z.object({
  status: TicketStatusSchema.optional(),
  category: SupportCategorySchema.optional(),
  priority: TicketPrioritySchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const SupportStatsDtoSchema = z.object({
  openTickets: z.number().int(),
  inProgressTickets: z.number().int(),
  resolvedTickets: z.number().int(),
  avgResolutionTimeHours: z.number().nullable(),
  ticketsByCategory: z.record(z.string(), z.number().int()),
  ticketsByPriority: z.record(z.string(), z.number().int()),
});

export type SupportCategory = z.infer<typeof SupportCategorySchema>;
export type TicketStatus = z.infer<typeof TicketStatusSchema>;
export type TicketPriority = z.infer<typeof TicketPrioritySchema>;
export type CreateTicketDto = z.infer<typeof CreateTicketDtoSchema>;
export type UpdateTicketDto = z.infer<typeof UpdateTicketDtoSchema>;
export type AddMessageDto = z.infer<typeof AddMessageDtoSchema>;
export type TicketMessageResponseDto = z.infer<typeof TicketMessageResponseDtoSchema>;
export type TicketResponseDto = z.infer<typeof TicketResponseDtoSchema>;
export type TicketListQuery = z.infer<typeof TicketListQuerySchema>;
export type SupportStatsDto = z.infer<typeof SupportStatsDtoSchema>;

export class CreateTicketDtoClass extends createZodDto(CreateTicketDtoSchema) {}
export class UpdateTicketDtoClass extends createZodDto(UpdateTicketDtoSchema) {}
export class AddMessageDtoClass extends createZodDto(AddMessageDtoSchema) {}
export class TicketMessageResponseDtoClass extends createZodDto(TicketMessageResponseDtoSchema) {}
export class TicketResponseDtoClass extends createZodDto(TicketResponseDtoSchema) {}
export class TicketListQueryDto extends createZodDto(TicketListQuerySchema) {}
export class SupportStatsDtoClass extends createZodDto(SupportStatsDtoSchema) {}
