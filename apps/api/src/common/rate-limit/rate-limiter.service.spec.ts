import type { RedisService } from '../../redis/redis.service';
import { RateLimiterService } from './rate-limiter.service';

function withRedisDisabled(): RateLimiterService {
  return new RateLimiterService({ isEnabled: false } as unknown as RedisService);
}

function withFailingRedis(): RateLimiterService {
  const redis = {
    isEnabled: true,
    getClient: (): never => {
      throw new Error('connection refused');
    },
  };

  return new RateLimiterService(redis as unknown as RedisService);
}

describe('RateLimiterService', () => {
  describe('in-process fallback (no Redis configured)', () => {
    it('allows requests up to the limit', async () => {
      const limiter = withRedisDisabled();
      const limit = { limit: 3, windowSeconds: 60 };

      const first = await limiter.consume('key-a', limit);
      const second = await limiter.consume('key-a', limit);
      const third = await limiter.consume('key-a', limit);

      expect([first.allowed, second.allowed, third.allowed]).toEqual([true, true, true]);
      expect(third.remaining).toBe(0);
    });

    it('denies the request that exceeds the limit', async () => {
      const limiter = withRedisDisabled();
      const limit = { limit: 2, windowSeconds: 60 };

      await limiter.consume('key-b', limit);
      await limiter.consume('key-b', limit);
      const denied = await limiter.consume('key-b', limit);

      expect(denied.allowed).toBe(false);
      expect(denied.remaining).toBe(0);
      expect(denied.retryAfterSeconds).toBeGreaterThan(0);
    });

    it('counts keys independently, so one phone cannot exhaust another', async () => {
      const limiter = withRedisDisabled();
      const limit = { limit: 1, windowSeconds: 60 };

      await limiter.consume('phone-1', limit);
      const other = await limiter.consume('phone-2', limit);

      expect(other.allowed).toBe(true);
    });

    it('resets once the window has elapsed', async () => {
      const limiter = withRedisDisabled();
      const limit = { limit: 1, windowSeconds: 60 };

      await limiter.consume('key-c', limit);
      expect((await limiter.consume('key-c', limit)).allowed).toBe(false);

      // Advance past the window rather than sleeping through it.
      const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(Date.now() + 61_000);
      expect((await limiter.consume('key-c', limit)).allowed).toBe(true);
      nowSpy.mockRestore();
    });

    it('reports seconds remaining, suitable for Retry-After', async () => {
      const limiter = withRedisDisabled();
      const decision = await limiter.consume('key-d', { limit: 1, windowSeconds: 120 });

      expect(decision.retryAfterSeconds).toBeLessThanOrEqual(120);
      expect(decision.retryAfterSeconds).toBeGreaterThan(0);
    });
  });

  describe('when Redis fails', () => {
    it('fails open so a cache outage cannot take the API down', async () => {
      const limiter = withFailingRedis();

      const decision = await limiter.consume('key-e', { limit: 1, windowSeconds: 60 });

      expect(decision.allowed).toBe(true);
    });
  });
});
