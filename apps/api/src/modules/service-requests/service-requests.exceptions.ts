import { HttpStatus } from '@nestjs/common';
import { ERROR_CODES, SERVICE_REQUEST_ERROR_CODES } from '@nest/types';
import { ApiException } from '../../common/errors/api-exception';

export class ServiceRequestNotFoundException extends ApiException {
  constructor() {
    super(
      HttpStatus.NOT_FOUND,
      SERVICE_REQUEST_ERROR_CODES.NOT_FOUND,
      'Service request not found.',
    );
  }
}

export class ServiceRequestNotAuthorizedException extends ApiException {
  constructor() {
    super(
      HttpStatus.FORBIDDEN,
      SERVICE_REQUEST_ERROR_CODES.NOT_AUTHORIZED,
      'You can only access your own service requests.',
    );
  }
}

export class ServiceRequestAlreadyMatchedException extends ApiException {
  constructor() {
    super(
      HttpStatus.CONFLICT,
      SERVICE_REQUEST_ERROR_CODES.ALREADY_MATCHED,
      'This service request has already been matched to a booking.',
    );
  }
}

export class AttachmentTooLargeException extends ApiException {
  constructor(maxBytes: number) {
    super(HttpStatus.PAYLOAD_TOO_LARGE, ERROR_CODES.PAYLOAD_TOO_LARGE, 'That file is too large.', {
      maxBytes,
    });
  }
}

export class UnsupportedAttachmentTypeException extends ApiException {
  constructor(allowed: readonly string[]) {
    super(
      HttpStatus.UNSUPPORTED_MEDIA_TYPE,
      ERROR_CODES.UNSUPPORTED_MEDIA_TYPE,
      'That file type is not accepted. Upload a JPEG, PNG, WebP or PDF.',
      { allowed: [...allowed] },
    );
  }
}

export class AttachmentFileRequiredException extends ApiException {
  constructor() {
    super(HttpStatus.BAD_REQUEST, ERROR_CODES.VALIDATION_FAILED, 'An attachment file is required.');
  }
}

export class TranscriptionUnavailableException extends ApiException {
  constructor() {
    super(
      HttpStatus.SERVICE_UNAVAILABLE,
      ERROR_CODES.SERVICE_UNAVAILABLE,
      'Voice transcription is temporarily unavailable. Please type your request instead.',
    );
  }
}
