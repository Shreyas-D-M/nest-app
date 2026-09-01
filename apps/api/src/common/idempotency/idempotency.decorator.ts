import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

/**
 * Extracts the idempotency key from the request header.
 * Expected header: `Idempotency-Key: <key>`
 */
export const IdempotencyKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['idempotency-key'] as string | undefined;
  },
);
