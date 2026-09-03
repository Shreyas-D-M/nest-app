import { z } from 'zod';
import { SERVICE_REQUEST_STATUSES, SERVICE_REQUEST_DOCUMENT_TYPES } from '@nest/types';
import { boundedTextSchema, uuidSchema } from './primitives';

/**
 * Service request validation schemas.
 *
 * Field lengths mirror database column widths.
 */

export const serviceRequestStatusSchema = z.enum(SERVICE_REQUEST_STATUSES);
export const serviceRequestDocumentTypeSchema = z.enum(SERVICE_REQUEST_DOCUMENT_TYPES);

/**
 * `POST /service-requests` — create a service request from customer input.
 *
 * Raw text is mandatory (the customer's own words). Address and media are
 * optional: a request can start as text-only and have photos added later.
 */
export const serviceRequestCreateSchema = z.object({
  rawText: boundedTextSchema(1, 2000),
  addressId: uuidSchema.optional(),
  /** Optional voice recording storage URL. */
  voiceUrl: z.string().url().max(1024).optional(),
  /** Optional array of media storage URLs (photos/documents). */
  media: z.array(z.string().url()).max(20).optional(),
});

export type ServiceRequestCreateInput = z.infer<typeof serviceRequestCreateSchema>;

/**
 * `POST /service-requests/:id/attachments` — add photos to a request.
 *
 * The file itself arrives as multipart content; this schema validates metadata
 * only. The actual file validation happens in the controller.
 */
export const serviceRequestAttachmentSchema = z.object({
  /** Optional caption for the attachment. */
  caption: boundedTextSchema(1, 200).optional(),
});

export type ServiceRequestAttachmentInput = z.infer<typeof serviceRequestAttachmentSchema>;

/**
 * `GET /service-requests` — list customer's service requests.
 */
export const serviceRequestListQuerySchema = z.object({
  status: serviceRequestStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
  offset: z.coerce.number().int().min(0).default(0),
});

export type ServiceRequestListQueryInput = z.infer<typeof serviceRequestListQuerySchema>;
