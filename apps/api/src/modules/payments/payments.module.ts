import { Module } from '@nestjs/common';
import { PAYMENT_PROVIDER } from './payment-provider';
import { StubPaymentProvider } from './stub-payment-provider';

@Module({
  providers: [{ provide: PAYMENT_PROVIDER, useClass: StubPaymentProvider }],
  exports: [PAYMENT_PROVIDER],
})
export class PaymentsModule {}
