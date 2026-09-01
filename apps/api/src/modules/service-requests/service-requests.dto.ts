import { createZodDto } from 'nestjs-zod';
import { serviceRequestCreateSchema, serviceRequestAttachmentSchema } from '@nest/validation';

/**
 * Service request DTOs.
 *
 * Generated from the Zod schemas in @nest/validation so validation rules are
 * defined once and shared across the monorepo.
 */

export class ServiceRequestCreateDto extends createZodDto(serviceRequestCreateSchema) {}

export class ServiceRequestAttachmentDto extends createZodDto(serviceRequestAttachmentSchema) {}
