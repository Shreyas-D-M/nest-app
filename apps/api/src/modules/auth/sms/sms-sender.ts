/**
 * SMS delivery seam.
 *
 * 07_ARCHITECTURE.md defers the SMS provider to implementation time, so the OTP
 * flow depends on this interface rather than on any vendor. Swapping in a real
 * provider means adding one implementation and one enum value — no change to the
 * authentication logic.
 */

export interface SmsMessage {
  /** Destination in E.164 form. */
  to: string;
  body: string;
}

export interface SmsSender {
  send(message: SmsMessage): Promise<void>;
}

/** Injection token — `SmsSender` is an interface and has no runtime identity. */
export const SMS_SENDER = Symbol('SMS_SENDER');
