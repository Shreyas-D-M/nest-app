import { Injectable, Logger } from '@nestjs/common';
import type { SmsMessage, SmsSender } from './sms-sender';

/**
 * Development SMS sender: writes the message to the log and delivers nothing.
 *
 * This exists so the OTP flow can be built and tested without a provider
 * account. It is NOT a stand-in for a real integration:
 *
 *   * `apiEnvSchema` rejects `SMS_PROVIDER=log` when NODE_ENV is production, so
 *     this class cannot reach a production deployment.
 *   * It logs the message body, including the code. That is the entire point in
 *     development and is exactly why it must never run anywhere real.
 */
@Injectable()
export class LoggingSmsSender implements SmsSender {
  private readonly logger = new Logger(LoggingSmsSender.name);

  send(message: SmsMessage): Promise<void> {
    this.logger.warn(
      `[DEV SMS — not delivered] to=${message.to} body=${JSON.stringify(message.body)}`,
    );

    return Promise.resolve();
  }
}
