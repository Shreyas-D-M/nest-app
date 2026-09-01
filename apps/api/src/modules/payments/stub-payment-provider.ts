import { Injectable, Logger } from '@nestjs/common';
import type { PaymentStatus } from '@nest/types';
import { randomUUID } from 'node:crypto';
import type { PaymentProvider } from './payment-provider';

/**
 * Stub payment provider for development.
 *
 * Logs all calls and returns fake success responses. Does not process real
 * payments. A boot guard in env.schema.ts rejects this provider in production,
 * because a payment system that silently fails to charge is worse than one that
 * refuses to start.
 */
@Injectable()
export class StubPaymentProvider implements PaymentProvider {
  private readonly logger = new Logger(StubPaymentProvider.name);

  /**
   * Logs the initiation request and returns a fake provider payment ID.
   *
   * The checkout URL points to localhost and will not work, but allows the
   * flow to be tested without a real payment gateway.
   */
  async initiatePayment(params: {
    bookingId: string;
    amountMinor: number;
    currency: string;
    customerPhone: string;
    idempotencyKey: string;
  }): Promise<{
    providerPaymentId: string;
    checkoutUrl: string;
  }> {
    this.logger.warn(
      `[STUB] initiatePayment called: bookingId=${params.bookingId}, ` +
        `amount=${params.amountMinor} ${params.currency}, ` +
        `customer=${params.customerPhone}, ` +
        `idempotencyKey=${params.idempotencyKey}`,
    );

    const providerPaymentId = `stub_${randomUUID()}`;
    const checkoutUrl = `https://localhost:3000/stub-checkout/${providerPaymentId}`;

    this.logger.warn(
      `[STUB] Payment initiated: providerPaymentId=${providerPaymentId}, ` +
        `checkoutUrl=${checkoutUrl}`,
    );

    return {
      providerPaymentId,
      checkoutUrl,
    };
  }

  /**
   * Logs the verification request and returns fake success.
   *
   * Always returns COMPLETED status with current timestamp. Real implementations
   * would query the provider's API to check actual payment status.
   */
  async verifyPayment(providerPaymentId: string): Promise<{
    status: PaymentStatus;
    paidAt: Date | null;
  }> {
    this.logger.warn(`[STUB] verifyPayment called: providerPaymentId=${providerPaymentId}`);

    const result = {
      status: 'COMPLETED' as PaymentStatus,
      paidAt: new Date(),
    };

    this.logger.warn(
      `[STUB] Payment verified: status=${result.status}, paidAt=${result.paidAt.toISOString()}`,
    );

    return result;
  }

  /**
   * Logs the refund request and returns a fake refund ID.
   *
   * Real implementations would call the provider's refund API and handle
   * asynchronous refund processing.
   */
  async refundPayment(params: {
    providerPaymentId: string;
    amountMinor: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<{
    providerRefundId: string;
  }> {
    this.logger.warn(
      `[STUB] refundPayment called: providerPaymentId=${params.providerPaymentId}, ` +
        `amount=${params.amountMinor}, ` +
        `reason="${params.reason}", ` +
        `idempotencyKey=${params.idempotencyKey}`,
    );

    const providerRefundId = `stub_refund_${randomUUID()}`;

    this.logger.warn(`[STUB] Refund initiated: providerRefundId=${providerRefundId}`);

    return {
      providerRefundId,
    };
  }
}
