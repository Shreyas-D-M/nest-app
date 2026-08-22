import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { API_PREFIX, REQUEST_ID_HEADER } from '@nest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * End-to-end coverage of the API shell: health endpoints, request-id handling and
 * the standard error envelope.
 *
 * PrismaService is replaced with a double so the suite needs no live database and
 * cannot hang on a connection timeout. Redis needs no double — REDIS_URL is unset
 * here, so the real service reports itself disabled without connecting.
 */
describe('API shell (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Placeholder configuration. These are not credentials — no service is
    // contacted with them.
    process.env['NODE_ENV'] = 'test';
    process.env['DATABASE_URL'] = 'postgresql://test:test@localhost:5432/nest_test';
    process.env['LOG_LEVEL'] = 'error';
    delete process.env['REDIS_URL'];
    delete process.env['CORS_ALLOWED_ORIGINS'];

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: (): Promise<void> => Promise.resolve(),
        onModuleDestroy: (): Promise<void> => Promise.resolve(),
        checkHealth: (): Promise<{ status: string; latencyMs: number }> =>
          Promise.resolve({ status: 'up', latencyMs: 1 }),
      })
      .compile();

    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`GET ${API_PREFIX}/health`, () => {
    it('returns 200 with the service identity', async () => {
      const response = await request(app.getHttpServer()).get(`${API_PREFIX}/health`).expect(200);

      expect(response.body).toMatchObject({
        status: 'ok',
        service: 'nest-api',
      });
      expect(typeof response.body.uptimeSeconds).toBe('number');
    });

    it('is served under the versioned prefix only', async () => {
      await request(app.getHttpServer()).get('/health').expect(404);
    });

    it('attaches a request id to the response', async () => {
      const response = await request(app.getHttpServer()).get(`${API_PREFIX}/health`).expect(200);

      expect(response.headers[REQUEST_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/);
    });

    it('echoes a well-formed client request id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/health`)
        .set(REQUEST_ID_HEADER, 'client-supplied-id-1')
        .expect(200);

      expect(response.headers[REQUEST_ID_HEADER]).toBe('client-supplied-id-1');
    });

    it('replaces a malformed client request id', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/health`)
        .set(REQUEST_ID_HEADER, 'bad id with spaces')
        .expect(200);

      expect(response.headers[REQUEST_ID_HEADER]).not.toBe('bad id with spaces');
      expect(response.headers[REQUEST_ID_HEADER]).toMatch(/^[0-9a-f-]{36}$/);
    });
  });

  describe(`GET ${API_PREFIX}/health/ready`, () => {
    it('returns 200 and per-dependency status when ready', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/health/ready`)
        .expect(200);

      expect(response.body.status).toBe('ok');
      expect(response.body.dependencies.database.status).toBe('up');
      expect(response.body.dependencies.redis.status).toBe('disabled');
    });
  });

  describe('error envelope', () => {
    it('matches the shape defined in 06_API_SPEC.md', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/does-not-exist`)
        .expect(404);

      expect(response.body).toEqual({
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
          details: {},
        },
        requestId: expect.any(String),
      });
    });

    it('reports the same request id in the body and the header', async () => {
      const response = await request(app.getHttpServer())
        .get(`${API_PREFIX}/does-not-exist`)
        .set(REQUEST_ID_HEADER, 'trace-me-12345')
        .expect(404);

      expect(response.body.requestId).toBe('trace-me-12345');
      expect(response.headers[REQUEST_ID_HEADER]).toBe('trace-me-12345');
    });
  });
});
