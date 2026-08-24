import {
  professionalAvailabilityUpdateSchema,
  professionalDocumentSchema,
  professionalOnboardingSchema,
  professionalProfileUpdateSchema,
  professionalServicesUpdateSchema,
  professionalStatusSchema,
} from '@nest/validation';
import { createZodDto } from '../../common/validation/zod-dto';

export class ProfessionalOnboardingDto extends createZodDto(professionalOnboardingSchema) {}

export class ProfessionalProfileUpdateDto extends createZodDto(professionalProfileUpdateSchema) {}

export class ProfessionalServicesUpdateDto extends createZodDto(professionalServicesUpdateSchema) {}

export class ProfessionalAvailabilityUpdateDto extends createZodDto(
  professionalAvailabilityUpdateSchema,
) {}

export class ProfessionalStatusDto extends createZodDto(professionalStatusSchema) {}

export class ProfessionalDocumentDto extends createZodDto(professionalDocumentSchema) {}
