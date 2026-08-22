import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import type { DependencyCheck } from '@nest/types';
import { AppConfigService } from '../config/app-config.service';

/**
 * PostgreSQL access.
 *
 * PostgreSQL is the source of truth for every piece of state in NEST.
 *
 * Prisma 7 requires an explicit driver adapter, so the connection string is
 * passed here at construction rather than read from the schema. Passing it as
 * pool configuration (rather than a bare string) leaves room to tune pool size
 * and timeouts when load justifies it.
 *
 * Connection failure at startup is logged but does not crash the process: the
 * readiness probe reports the database as down so the platform stops routing
 * traffic here, while the liveness probe keeps answering. Crashing instead would
 * turn a brief database blip into a restart loop.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(config: AppConfigService) {
    super({
      adapter: new PrismaPg({ connectionString: config.databaseUrl }),
    });
  }

  async onModuleInit(): Promise<void> {
    // Prisma 7's driver adapter connects lazily, so `$connect()` succeeding
    // proves nothing about reachability. An actual query is issued instead, so a
    // misconfigured or unreachable database is visible at boot rather than on
    // the first user request.
    const check = await this.checkHealth();

    if (check.status === 'up') {
      this.logger.log(`PostgreSQL reachable (${check.latencyMs ?? 0} ms)`);
      return;
    }

    // The underlying error can contain the connection string, including the
    // password, so it is deliberately not logged.
    this.logger.error('PostgreSQL is not reachable at startup — readiness will report degraded');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async checkHealth(): Promise<DependencyCheck> {
    const startedAt = Date.now();

    try {
      await this.$queryRaw`SELECT 1`;

      return { status: 'up', latencyMs: Date.now() - startedAt };
    } catch {
      return { status: 'down', detail: 'Database query failed' };
    }
  }
}
