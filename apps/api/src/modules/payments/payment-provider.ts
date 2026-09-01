import type { PaymentStatus } from '@nest/types';

/**
 * Payment provider port abstraction.
 *
 * 07_ARCHITECTURE.md defers the payment provider to implementation time, so
 * payment logic depends on this interface rather than on any vendor.
 *
 * Implementations must be idempotent: retrying the same operation with the same
 * parameters must produce the same result without side effects (e.g., double
 * charges).
 */

export interface PaymentProvider {
  /**
   * Initiates a payment and returns provider payment ID + checkout URL.
   *
   * Implementation must be idempotent per (bookingId, amountMinor). The same
   * booking + amount must return the same providerPaymentId on retry.
   *
   * @param params Payment initiation parameters
   * @returns Provider payment ID and checkout URL for customer
   */
  initiatePayment(params: {
    bookingId: string;
    amountMinor: number;
    currency: string;
    customerPhone: string;
    idempotencyKey: string;
  }): Promise<{
    providerPaymentId: string;
    checkoutUrl: string;
  }>;

  /**
   * Verifies payment status with the provider.
   *
   * Called to check if a payment has completed, either from a webhook callback
   * or polling. Returns current status and paid timestamp if completed.
   *
   * @param providerPaymentId The provider's payment identifier
   * @returns Payment status and paid timestamp
   */
  verifyPayment(providerPaymentId: string): Promise<{
    status: PaymentStatus;
    paidAt: Date | null;
  }>;

  /**
   * Initiates a refund.
   *
   * Implementation must be idempotent per (providerPaymentId, amountMinor).
   * Returns provider refund ID.
   *
   * @param params Refund parameters
   * @returns Provider refund identifier
   */
  refundPayment(params: {
    providerPaymentId: string;
    amountMinor: number;
    reason: string;
    idempotencyKey: string;
  }): Promise<{
    providerRefundId: string;
  }>;
}

/**
 * Injection token for PaymentProvider.
 *
 * Follows the pattern established by DocumentStorage: interface + token,
 * so implementations can be swapped via module configuration.
 */
export const PAYMENT_PROVIDER = Symbol('PAYMENT_PROVIDER');
