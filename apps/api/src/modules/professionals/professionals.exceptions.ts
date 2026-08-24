import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, PROFESSIONAL_ERROR_CODES, type VerificationStatus } from '@nest/types';
import { ApiException } from '../../common/errors/api-exception';

export class NotAProfessionalException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      PROFESSIONAL_ERROR_CODES.NOT_A_PROFESSIONAL,
      'Complete professional onboarding before using this feature.',
    );
  }
}

export class AlreadyAProfessionalException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      PROFESSIONAL_ERROR_CODES.ALREADY_A_PROFESSIONAL,
      'This account already has a professional profile.',
    );
  }
}

/**
 * Raised when an action requires completed verification.
 *
 * The message names the current state so the professional knows whether to wait,
 * submit documents, or act on feedback.
 */
export class VerificationRequiredException extends ApiException {
  constructor(currentStatus: VerificationStatus) {
    super(
      HttpStatus.FORBIDDEN,
      PROFESSIONAL_ERROR_CODES.VERIFICATION_REQUIRED,
      'Your profile must be verified before you can do this.',
      { verificationStatus: currentStatus },
    );
  }
}

export class InvalidVerificationTransitionException extends ApiException {
  constructor(from: VerificationStatus, to: VerificationStatus) {
    super(
      HttpStatus.CONFLICT,
      PROFESSIONAL_ERROR_CODES.INVALID_VERIFICATION_TRANSITION,
      'That verification action is not valid for this profile right now.',
      { from, to },
    );
  }
}

export class DocumentsRequiredException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      PROFESSIONAL_ERROR_CODES.DOCUMENTS_REQUIRED,
      'Upload at least one verification document before requesting a review.',
    );
  }
}

/**
 * Raised for a document whose content type is not accepted.
 *
 * Uses the transport-level code so clients can handle it with the same branch as
 * any other unsupported upload.
 */
export class UnsupportedDocumentTypeException extends ApiException {
  constructor(allowed: readonly string[]) {
    super(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      'That file type is not accepted. Upload a JPEG, PNG, WebP or PDF.',
      { allowed: [...allowed] },
    );
  }
}

export class DocumentTooLargeException extends ApiException {
  constructor(maxBytes: number) {
    super(
      HttpStatus.PAYLOAD_TOO_LARGE,
      ERROR_CODES.PAYLOAD_TOO_LARGE,
      'That file is too large.',
      { maxBytes },
    );
  }
}

/** Raised when a document upload arrives with no file attached. */
export class DocumentFileRequiredException extends ApiException {
  constructor() {
    super(
      HttpStatus.BAD_REQUEST,
      ERROR_CODES.VALIDATION_FAILED,
      'A document file is required.',
    );
  }
}
