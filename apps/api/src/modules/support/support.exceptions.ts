export class SupportException extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'SupportException';
  }
}

export class TicketNotFoundException extends SupportException {
  constructor(id: string) {
    super(`Ticket with id ${id} not found`, 'TICKET_NOT_FOUND');
    this.name = 'TicketNotFoundException';
  }
}

export class TicketNotAuthorizedException extends SupportException {
  constructor(message = 'Not authorized to perform this action on ticket') {
    super(message, 'TICKET_NOT_AUTHORIZED');
    this.name = 'TicketNotAuthorizedException';
  }
}

export class TicketAlreadyClosedException extends SupportException {
  constructor(id: string) {
    super(`Ticket ${id} is already closed`, 'TICKET_ALREADY_CLOSED');
    this.name = 'TicketAlreadyClosedException';
  }
}

export class TicketMessageNotFoundException extends SupportException {
  constructor(id: string) {
    super(`Ticket message with id ${id} not found`, 'TICKET_MESSAGE_NOT_FOUND');
    this.name = 'TicketMessageNotFoundException';
  }
}
