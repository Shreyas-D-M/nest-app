import { HttpStatus } from '@nestjs/common';
import { BOOKING_ERROR_CODES } from '@nest/types';

/**
 * Booking exceptions with consistent error codes from types package.
 */
export class BookingException extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'BookingException';
  }
}

export class BookingNotFoundException extends BookingException {
  constructor() {
    super('Booking not found', BOOKING_ERROR_CODES.NOT_FOUND, HttpStatus.NOT_FOUND);
  }
}

export class BookingInvalidStatusTransitionException extends BookingException {
  constructor(current: string, requested: string, actor: string) {
    super(
      `Invalid status transition from ${current} to ${requested} for ${actor}`,
      BOOKING_ERROR_CODES.INVALID_STATUS_TRANSITION,
      HttpStatus.CONFLICT,
      { current, requested, actor },
    );
  }
}

export class BookingCannotCancelException extends BookingException {
  constructor(status: string) {
    super(
      `Cannot cancel booking in status ${status}`,
      BOOKING_ERROR_CODES.CANNOT_CANCEL,
      HttpStatus.CONFLICT,
      { status },
    );
  }
}

export class BookingNotAuthorizedException extends BookingException {
  constructor() {
    super(
      'Not authorized to access this booking',
      BOOKING_ERROR_CODES.NOT_AUTHORIZED,
      HttpStatus.FORBIDDEN,
    );
  }
}

export class ProfessionalNotAvailableException extends BookingException {
  constructor() {
    super(
      'Professional is not available for the selected time',
      BOOKING_ERROR_CODES.PROFESSIONAL_NOT_AVAILABLE,
      HttpStatus.CONFLICT,
    );
  }
}

export class SlotNotAvailableException extends BookingException {
  constructor() {
    super(
      'Selected time slot is not available',
      BOOKING_ERROR_CODES.SLOT_NOT_AVAILABLE,
      HttpStatus.CONFLICT,
    );
  }
}

export class ExtraWorkPendingException extends BookingException {
  constructor() {
    super(
      'Extra work approval is pending',
      BOOKING_ERROR_CODES.EXTRA_WORK_PENDING,
      HttpStatus.CONFLICT,
    );
  }
}

export class PaymentRequiredException extends BookingException {
  constructor() {
    super(
      'Payment is required before this action',
      BOOKING_ERROR_CODES.PAYMENT_REQUIRED,
      HttpStatus.CONFLICT,
    );
  }
}

export class AlreadyReviewedException extends BookingException {
  constructor() {
    super(
      'Booking has already been reviewed',
      BOOKING_ERROR_CODES.ALREADY_REVIEWED,
      HttpStatus.CONFLICT,
    );
  }
}
