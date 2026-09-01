import { createZodDto } from 'nestjs-zod';
import {
  bookingCreateSchema,
  bookingCancelSchema,
  extraWorkApprovalSchema,
  bookingReviewSchema,
  bookingListQuerySchema,
  professionalJobListQuerySchema,
  professionalJobAcceptSchema,
  professionalJobDeclineSchema,
  professionalExtraWorkSchema,
  professionalJobActionSchema,
} from '@nest/validation';

/**
 * DTO for professional job actions that take no body.
 */
export class ProfessionalJobActionDto extends createZodDto(professionalJobActionSchema) {}

/**
 * Customer booking DTOs.
 */
export class BookingCreateDto extends createZodDto(bookingCreateSchema) {}
export class BookingCancelDto extends createZodDto(bookingCancelSchema) {}
export class ExtraWorkApprovalDto extends createZodDto(extraWorkApprovalSchema) {}
export class BookingReviewDto extends createZodDto(bookingReviewSchema) {}
export class BookingListQueryDto extends createZodDto(bookingListQuerySchema) {}

/**
 * Professional job DTOs.
 */
export class ProfessionalJobListQueryDto extends createZodDto(professionalJobListQuerySchema) {}
export class ProfessionalJobAcceptDto extends createZodDto(professionalJobAcceptSchema) {}
export class ProfessionalJobDeclineDto extends createZodDto(professionalJobDeclineSchema) {}
export class ProfessionalExtraWorkDto extends createZodDto(professionalExtraWorkSchema) {}
