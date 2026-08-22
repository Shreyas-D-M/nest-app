import type { PrismaService } from '../../prisma/prisma.service';
import type { RedisService } from '../../redis/redis.service';
import { SERVICE_NAME, SERVICE_VERSION } from './health.constants';
import { HealthService } from './health.service';

function buildService(): {
  service: HealthService;
  prisma: { checkHealth: jest.Mock };
  redis: { checkHealth: jest.Mock };
} {
  const prisma = { checkHealth: jest.fn() };
  const redis = { checkHealth: jest.fn() };

  const service = new HealthService(
    prisma as unknown as PrismaService,
    redis as unknown as RedisService,
  );

  return { service, prisma, redis };
}

describe('HealthService', () => {
  describe('getLiveness', () => {
    it('reports the service identity without touching any dependency', () => {
      const { service, prisma, redis } = buildService();

      const result = service.getLiveness();

      expect(result.status).toBe('ok');
      expect(result.service).toBe(SERVICE_NAME);
      expect(result.version).toBe(SERVICE_VERSION);
      expect(Number.isInteger(result.uptimeSeconds)).toBe(true);
      expect(result.uptimeSeconds).toBeGreaterThanOrEqual(0);

      // Liveness must not depend on external systems, or a database blip
      // becomes a restart loop.
      expect(prisma.checkHealth).not.toHaveBeenCalled();
      expect(redis.checkHealth).not.toHaveBeenCalled();
    });
  });

  describe('getReadiness', () => {
    it('is ok when every dependency is up', async () => {
      const { service, prisma, redis } = buildService();
      prisma.checkHealth.mockResolvedValue({ status: 'up', latencyMs: 2 });
      redis.checkHealth.mockResolvedValue({ status: 'up', latencyMs: 1 });

      const result = await service.getReadiness();

      expect(result.status).toBe('ok');
      expect(result.dependencies['database']?.status).toBe('up');
      expect(result.dependencies['redis']?.status).toBe('up');
    });

    it('treats a disabled optional dependency as ok, not as a failure', async () => {
      const { service, prisma, redis } = buildService();
      prisma.checkHealth.mockResolvedValue({ status: 'up', latencyMs: 2 });
      redis.checkHealth.mockResolvedValue({
        status: 'disabled',
        detail: 'REDIS_URL is not configured',
      });

      const result = await service.getReadiness();

      expect(result.status).toBe('ok');
      expect(result.dependencies['redis']?.status).toBe('disabled');
    });

    it('is degraded when the database is down', async () => {
      const { service, prisma, redis } = buildService();
      prisma.checkHealth.mockResolvedValue({ status: 'down', detail: 'Database query failed' });
      redis.checkHealth.mockResolvedValue({ status: 'up', latencyMs: 1 });

      const result = await service.getReadiness();

      expect(result.status).toBe('degraded');
    });

    it('is degraded when Redis is configured but unreachable', async () => {
      const { service, prisma, redis } = buildService();
      prisma.checkHealth.mockResolvedValue({ status: 'up', latencyMs: 2 });
      redis.checkHealth.mockResolvedValue({ status: 'down', detail: 'Redis ping failed' });

      const result = await service.getReadiness();

      expect(result.status).toBe('degraded');
    });

    it('never leaks a connection string in dependency detail', async () => {
      const { service, prisma, redis } = buildService();
      prisma.checkHealth.mockResolvedValue({ status: 'down', detail: 'Database query failed' });
      redis.checkHealth.mockResolvedValue({ status: 'disabled' });

      const result = await service.getReadiness();

      expect(JSON.stringify(result)).not.toMatch(/postgres|password|@/i);
    });
  });
});
