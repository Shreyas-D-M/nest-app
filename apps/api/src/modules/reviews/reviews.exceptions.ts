export class ReviewException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'ReviewException';
  }
}

export class ReviewNotFoundException extends ReviewException {
  constructor(id: string) {
    super(`Review with id ${id} not found`, 'REVIEW_NOT_FOUND');
    this.name = 'ReviewNotFoundException';
  }
}

export class ReviewAlreadyExistsException extends ReviewException {
  constructor(bookingId: string) {
    super(`Review already exists for booking ${bookingId}`, 'REVIEW_ALREADY_EXISTS');
    this.name = 'ReviewAlreadyExistsException';
  }
}

export class ReviewNotAuthorizedException extends ReviewException {
  constructor(message = 'Not authorized to perform this action on review') {
    super(message, 'REVIEW_NOT_AUTHORIZED');
    this.name = 'ReviewNotAuthorizedException';
  }
}

export class ReviewNotEligibleException extends ReviewException {
  constructor(reason: string) {
    super(`Cannot submit review: ${reason}`, 'REVIEW_NOT_ELIGIBLE');
    this.name = 'ReviewNotEligibleException';
  }
}

export class ReviewTagNotFoundException extends ReviewException {
  constructor(id: string) {
    super(`Review tag with id ${id} not found`, 'REVIEW_TAG_NOT_FOUND');
    this.name = 'ReviewTagNotFoundException';
  }
}
