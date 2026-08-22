import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';
import type { ZodError } from 'zod';
import { ValidationFailedException } from '../errors/api-exception';
import { isZodDto } from './zod-dto';

interface IssueSummary {
  path: string;
  message: string;
}

/**
 * Reports which fields failed and why — never what they contained.
 *
 * Echoing submitted values back would reflect user input into a response and,
 * for fields like phone numbers or addresses, would put personal data into
 * error payloads and logs.
 */
function summariseIssues(error: ZodError): IssueSummary[] {
  return error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
    message: issue.message,
  }));
}

/**
 * Global validation pipe.
 *
 * Registered application-wide, so a handler cannot forget to validate: any
 * parameter typed as a Zod DTO is parsed, and the handler receives the parsed
 * (and therefore coerced and stripped) value rather than the raw body.
 *
 * Parameters that are not Zod DTOs pass through untouched — including primitives
 * such as route params. Phase 0 defines no DTOs yet, so nothing is validated in
 * practice; the wiring exists so that the first endpoint is validated by default
 * instead of by remembering to opt in.
 */
@Injectable()
export class ZodValidationPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata): unknown {
    const { metatype } = metadata;

    if (!isZodDto(metatype)) {
      return value;
    }

    const result = metatype.zodSchema.safeParse(value);

    if (result.success) {
      return result.data;
    }

    throw new ValidationFailedException({ issues: summariseIssues(result.error) });
  }
}
