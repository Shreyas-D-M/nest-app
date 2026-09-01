import { HttpStatus, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { User } from '@prisma/client';
import request from 'supertest';
import { AppModule } from '../../app.module';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service requests E2E tests.
 *
 * Note: These tests require a real database connection and authentication setup.
 * They are skipped by default and should be run with proper test infrastructure.
 */
describe.skip('ServiceRequestsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let testUser: User;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);

    // Create test user and get access token
    testUser = await prisma.user.create({
      data: {
        phone: '+919876543210',
        status: 'ACTIVE',
        role: 'CUSTOMER',
      },
    });

    // TODO: Generate real access token through auth service
    accessToken = 'mock-token-for-integration-test';
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await prisma.serviceRequest.deleteMany({ where: { customerId: testUser.id } });
      await prisma.session.deleteMany({ where: { userId: testUser.id } });
      await prisma.user.delete({ where: { id: testUser.id } });
    }

    await app.close();
  });

  describe('POST /service-requests', () => {
    it('should create a service request', async () => {
      const response = await request(app.getHttpServer())
        .post('/service-requests')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          rawText: 'I need help fixing my ceiling fan',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        rawText: 'I need help fixing my ceiling fan',
        status: 'DRAFT',
        voiceUrl: null,
        media: null,
        aiCategory: null,
        aiConfidence: null,
        address: null,
        bookingId: null,
        createdAt: expect.any(String),
      });
    });

    it('should reject request without authentication', async () => {
      await request(app.getHttpServer())
        .post('/service-requests')
        .send({
          rawText: 'I need help',
        })
        .expect(HttpStatus.UNAUTHORIZED);
    });
  });

  describe('GET /service-requests/:id', () => {
    it('should return a service request for the owner', async () => {
      const created = await prisma.serviceRequest.create({
        data: {
          customerId: testUser.id,
          rawText: 'I need electrical work done',
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/service-requests/${created.id}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.OK);

      expect(response.body).toMatchObject({
        id: created.id,
        rawText: 'I need electrical work done',
        status: 'DRAFT',
      });
    });

    it('should return 404 for non-existent request', async () => {
      await request(app.getHttpServer())
        .get('/service-requests/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.NOT_FOUND);
    });
  });

  describe('POST /service-requests/:id/attachments', () => {
    it('should add an attachment to a service request', async () => {
      const created = await prisma.serviceRequest.create({
        data: {
          customerId: testUser.id,
          rawText: 'I need help with a broken appliance',
          status: 'DRAFT',
        },
      });

      const response = await request(app.getHttpServer())
        .post(`/service-requests/${created.id}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .attach('file', Buffer.from('fake-image-data'), {
          filename: 'photo.jpg',
          contentType: 'image/jpeg',
        })
        .expect(HttpStatus.CREATED);

      expect(response.body.media).toBeDefined();
      expect(Array.isArray(response.body.media)).toBe(true);
    });

    it('should reject attachment without file', async () => {
      const created = await prisma.serviceRequest.create({
        data: {
          customerId: testUser.id,
          rawText: 'I need help',
          status: 'DRAFT',
        },
      });

      await request(app.getHttpServer())
        .post(`/service-requests/${created.id}/attachments`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(HttpStatus.BAD_REQUEST);
    });
  });
});
