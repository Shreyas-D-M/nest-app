import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import type { DependencyCheck } from '@nest/types';
import { AppConfigService } from '../config/app-config.service';

/**
 * Redis access.
 *
 * Redis is used ONLY for caching, rate limiting, queues and transient realtime
 * support (07_ARCHITECTURE.md). It is never the source of truth: anything stored
 * here must be reconstructible from PostgreSQL, because Redis can evict a key or
 * lose its dataset at any time.
 *
 * Redis is optional. When `REDIS_URL` is unset the service reports as disabled
 * and `getClient()` throws — a caller that needs Redis fails loudly instead of
 * silently skipping a rate limit.
 */
@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis | null;

  constructor(config: AppConfigService) {
    const url = config.redisUrl;

    if (url === undefined) {
      this.client = null;
      this.logger.warn('REDIS_URL is not set — Redis-backed features are disabled');
      return;
    }

    this.client = new Redis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 2,
      // Fail fast rather than queueing commands while disconnected; a queued
      // rate-limit check that resolves seconds later is worse than an error.
      enableOfflineQueue: false,
    });

    this.client.on('error', (error: Error) => {
      this.logger.error(`Redis connection error: ${error.name}`);
    });
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  getClient(): Redis {
    if (this.client === null) {
      throw new Error('Redis is not configured. Set REDIS_URL to enable it.');
    }

    return this.client;
  }

  async checkHealth(): Promise<DependencyCheck> {
    if (this.client === null) {
      return { status: 'disabled', detail: 'REDIS_URL is not configured' };
    }

    const startedAt = Date.now();

    try {
      await this.client.ping();

      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'down', detail: 'Redis ping failed' };
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client === null) {
      return;
    }

    await this.client.quit();
  }
}
