import { Injectable } from '@nestjs/common';
import type { DependencyCheck, LivenessResponse, ReadinessResponse } from '@nest/types';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { SERVICE_NAME, SERVICE_VERSION } from './health.constants';

/**
 * Liveness and readiness are deliberately separate.
 *
 * Liveness answers "is the process alive?" and touches nothing external, so a
 * database outage cannot trigger a restart loop. Readiness answers "should this
 * instance receive traffic?" and therefore probes dependencies.
 *
 * A disabled dependency is not a failure: Redis is optional, so `disabled` is
 * reported distinctly from `down`.
 */
@Injectable()
export class HealthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      service: SERVICE_NAME,
      version: SERVICE_VERSION,
      uptimeSeconds: Math.floor(process.uptime()),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const [database, redis] = await Promise.all([
      this.prisma.checkHealth(),
      this.redis.checkHealth(),
    ]);

    const dependencies: Record<string, DependencyCheck> = { database, redis };

    const isDegraded = Object.values(dependencies).some((check) => check.status === 'down');

    return {
      status: isDegraded ? 'degraded' : 'ok',
      dependencies,
    };
  }
}
