import { logoutSchema, otpRequestSchema, otpVerifySchema, refreshSchema } from '@nest/validation';
import { createZodDto } from '../../common/validation/zod-dto';

/**
 * Request DTOs.
 *
 * Each wraps a schema from `@nest/validation`, so the API and the client apps
 * validate against the same definition. The global `ZodValidationPipe` picks these
 * up automatically — a handler cannot forget to validate.
 */

export class OtpRequestDto extends createZodDto(otpRequestSchema) {}

export class OtpVerifyDto extends createZodDto(otpVerifySchema) {}

export class RefreshDto extends createZodDto(refreshSchema) {}

export class LogoutDto extends createZodDto(logoutSchema) {}
