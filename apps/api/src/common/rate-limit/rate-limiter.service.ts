import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';

/**
 * Fixed-window rate limiting.
 *
 * 06_API_SPEC.md requires rate limiting on OTP, auth and other high-cost
 * endpoints. Counters live in Redis so that every API instance shares them —
 * a per-process limit is not a limit once the service is scaled.
 *
 * This is implemented directly rather than via `@nestjs/throttler` because the
 * limits that matter here are keyed on the *request body* (a phone number), not
 * on the client IP. Expressing that through the throttler's tracker abstraction
 * is more code than the twenty lines of Redis below, and less obvious to read.
 *
 * When Redis is not configured the limiter degrades to an in-process map. That is
 * sufficient for a single developer machine and useless across instances, which
 * is exactly why the environment schema makes `REDIS_URL` mandatory in
 * production.
 */

export interface RateLimit {
  /** Maximum permitted requests within the window. */
  limit: number;
  windowSeconds: number;
}

export interface RateLimitDecision {
  allowed: boolean;
  /** Requests still available in the current window. */
  remaining: number;
  /** Seconds until the window resets. Suitable for a Retry-After header. */
  retryAfterSeconds: number;
}

interface MemoryCounter {
  count: number;
  resetAtMs: number;
}

const KEY_PREFIX = 'ratelimit';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);

  /** Fallback store used only when Redis is not configured. */
  private readonly memoryCounters = new Map<string, MemoryCounter>();

  private hasWarnedAboutFallback = false;

  constructor(private readonly redis: RedisService) {}

  /**
   * Records one request against `key` and reports whether it is permitted.
   *
   * A Redis failure fails **open** — the request is allowed. Rate limiting
   * protects against abuse and cost; taking the whole API down because a cache is
   * briefly unavailable trades a small risk for a large one. The failure is
   * logged so it cannot pass unnoticed.
   */
  async consume(key: string, { limit, windowSeconds }: RateLimit): Promise<RateLimitDecision> {
    if (!this.redis.isEnabled) {
      return this.consumeInMemory(key, limit, windowSeconds);
    }

    try {
      return await this.consumeInRedis(key, limit, windowSeconds);
    } catch {
      this.logger.error(`Rate limiter unavailable; allowing request for key prefix "${key}"`);

      return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
    }
  }

  private async consumeInRedis(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<RateLimitDecision> {
    const redisKey = `${KEY_PREFIX}:${key}`;
    const client = this.redis.getClient();

    // MULTI keeps the increment and the expiry in one atomic step. `EXPIRE ... NX`
    // sets the TTL only when none exists, so the window is anchored to the first
    // request rather than sliding forward on every hit.
    const results = await client
      .multi()
      .incr(redisKey)
      .expire(redisKey, windowSeconds, 'NX')
      .ttl(redisKey)
      .exec();

    if (results === null) {
      throw new Error('Redis transaction returned no result');
    }

    const count = readNumber(results[0], 1);
    const ttl = readNumber(results[2], windowSeconds);

    // A missing or negative TTL means the key exists without an expiry; treat the
    // full window as remaining rather than leaking a permanent counter.
    const retryAfterSeconds = ttl > 0 ? ttl : windowSeconds;

    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds,
    };
  }

  private consumeInMemory(key: string, limit: number, windowSeconds: number): RateLimitDecision {
    if (!this.hasWarnedAboutFallback) {
      this.logger.warn(
        'REDIS_URL is not set — rate limits are per-process only and reset on restart',
      );
      this.hasWarnedAboutFallback = true;
    }

    const now = Date.now();
    this.pruneExpired(now);

    const existing = this.memoryCounters.get(key);

    if (existing === undefined || existing.resetAtMs <= now) {
      this.memoryCounters.set(key, { count: 1, resetAtMs: now + windowSeconds * 1000 });

      return { allowed: true, remaining: limit - 1, retryAfterSeconds: windowSeconds };
    }

    existing.count += 1;

    return {
      allowed: existing.count <= limit,
      remaining: Math.max(0, limit - existing.count),
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAtMs - now) / 1000)),
    };
  }

  /** Keeps the fallback map from growing without bound in a long dev session. */
  private pruneExpired(nowMs: number): void {
    for (const [key, counter] of this.memoryCounters) {
      if (counter.resetAtMs <= nowMs) {
        this.memoryCounters.delete(key);
      }
    }
  }
}

/** Reads one `[error, value]` entry from an ioredis MULTI result. */
function readNumber(entry: [Error | null, unknown] | undefined, fallback: number): number {
  if (entry === undefined) {
    return fallback;
  }

  const [error, value] = entry;

  if (error !== null || typeof value !== 'number') {
    return fallback;
  }

  return value;
}
