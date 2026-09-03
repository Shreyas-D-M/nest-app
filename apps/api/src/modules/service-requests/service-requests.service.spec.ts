import { Test, type TestingModule } from '@nestjs/testing';
import type { ServiceRequest } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import { DOCUMENT_STORAGE } from '../storage/document-storage';
import { SERVICE_REQUEST_INCLUDE } from './service-requests.service';
import {
  ServiceRequestNotFoundException,
  ServiceRequestNotAuthorizedException,
  ServiceRequestAlreadyMatchedException,
  AttachmentTooLargeException,
  UnsupportedAttachmentTypeException,
  TranscriptionUnavailableException,
} from './service-requests.exceptions';
import { ServiceRequestsService, type UploadedAttachmentFile } from './service-requests.service';

describe('ServiceRequestsService', () => {
  let service: ServiceRequestsService;

  const mockPrisma = {
    serviceRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    userAddress: {
      findFirst: jest.fn(),
    },
  };

  const mockStorage = {
    put: jest.fn(),
    signedUrl: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ServiceRequestsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: DOCUMENT_STORAGE, useValue: mockStorage },
        { provide: AppConfigService, useValue: { transcriptionProvider: 'local' } },
      ],
    }).compile();

    service = module.get<ServiceRequestsService>(ServiceRequestsService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a service request without address', async () => {
      const customerId = 'customer-1';
      const input = {
        rawText: 'I need help fixing my ceiling fan',
      };

      const created: ServiceRequest = {
        id: 'request-1',
        customerId,
        addressId: null,
        rawText: input.rawText,
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.create.mockResolvedValue({
        ...created,
        address: null,
        bookings: [],
      });

      const result = await service.create(customerId, input);

      expect(result.rawText).toBe(input.rawText);
      expect(result.customerId).toBe(customerId);
      expect(result.status).toBe('DRAFT');
      expect(mockPrisma.serviceRequest.create).toHaveBeenCalledWith({
        data: {
          customerId,
          addressId: undefined,
          rawText: input.rawText,
          voiceUrl: undefined,
          media: undefined,
          status: 'DRAFT',
        },
        include: SERVICE_REQUEST_INCLUDE,
      });
    });

    it('should create a service request with address', async () => {
      const customerId = 'customer-1';
      const addressId = 'address-1';
      const input = {
        rawText: 'I need help fixing my ceiling fan',
        addressId,
      };

      mockPrisma.userAddress.findFirst.mockResolvedValue({
        id: addressId,
        userId: customerId,
      });

      const created: ServiceRequest = {
        id: 'request-1',
        customerId,
        addressId,
        rawText: input.rawText,
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.create.mockResolvedValue({
        ...created,
        address: {
          id: addressId,
          label: 'Home',
          locality: 'Koramangala',
          city: 'Bangalore',
        },
        bookings: [],
      });

      const result = await service.create(customerId, input);

      expect(result.addressId).toBe(addressId);
      expect(mockPrisma.userAddress.findFirst).toHaveBeenCalledWith({
        where: { id: addressId, userId: customerId },
      });
    });

    it('should throw when address does not belong to customer', async () => {
      const customerId = 'customer-1';
      const input = {
        rawText: 'I need help',
        addressId: 'address-1',
      };

      mockPrisma.userAddress.findFirst.mockResolvedValue(null);

      await expect(service.create(customerId, input)).rejects.toThrow(
        ServiceRequestNotFoundException,
      );
    });

    it('should create a service request with media URLs', async () => {
      const customerId = 'customer-1';
      const input = {
        rawText: 'I need help fixing my ceiling fan',
        media: ['https://storage.example.com/photo1.jpg', 'https://storage.example.com/photo2.jpg'],
      };

      const created: ServiceRequest = {
        id: 'request-1',
        customerId,
        addressId: null,
        rawText: input.rawText,
        voiceUrl: null,
        media: input.media as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.create.mockResolvedValue({
        ...created,
        address: null,
        bookings: [],
      });

      const result = await service.create(customerId, input);

      expect(result.media).toEqual(input.media);
    });
  });

  describe('getById', () => {
    it('should return a service request for the owner', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      const result = await service.getById(requestId, customerId);

      expect(result.id).toBe(requestId);
      expect(result.customerId).toBe(customerId);
    });

    it('should throw not found when request does not exist', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      mockPrisma.serviceRequest.findUnique.mockResolvedValue(null);

      await expect(service.getById(requestId, customerId)).rejects.toThrow(
        ServiceRequestNotFoundException,
      );
    });

    it('should throw not authorized when request belongs to another customer', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId: 'customer-2',
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      await expect(service.getById(requestId, customerId)).rejects.toThrow(
        ServiceRequestNotAuthorizedException,
      );
    });
  });

  describe('addAttachment', () => {
    it('should add an attachment to a service request', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      mockStorage.put.mockResolvedValue({ key: 'stored-file-url' });

      const updated = {
        ...request,
        media: ['stored-file-url'],
        address: null,
        bookings: [],
      };

      mockPrisma.serviceRequest.update.mockResolvedValue(updated);

      const file: UploadedAttachmentFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      const result = await service.addAttachment(requestId, customerId, file, {});

      expect(result.media).toEqual(['stored-file-url']);
      expect(mockStorage.put).toHaveBeenCalledWith({
        professionalId: 'service-request',
        documentType: 'SERVICE_REQUEST_MEDIA',
        originalFilename: 'photo.jpg',
        contentType: 'image/jpeg',
        body: file.buffer,
      });
    });

    it('should append to existing media array', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: ['existing-url'] as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      mockStorage.put.mockResolvedValue({ key: 'new-url' });

      const updated = {
        ...request,
        media: ['existing-url', 'new-url'],
        address: null,
        bookings: [],
      };

      mockPrisma.serviceRequest.update.mockResolvedValue(updated);

      const file: UploadedAttachmentFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      const result = await service.addAttachment(requestId, customerId, file, {});

      expect(result.media).toEqual(['existing-url', 'new-url']);
    });

    it('should throw when request is already matched', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'MATCHED',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      const file: UploadedAttachmentFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('fake-image-data'),
      };

      await expect(service.addAttachment(requestId, customerId, file, {})).rejects.toThrow(
        ServiceRequestAlreadyMatchedException,
      );
    });

    it('should throw when file is too large', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      const file: UploadedAttachmentFile = {
        originalname: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 10 * 1024 * 1024 + 1, // Over 10MB
        buffer: Buffer.alloc(10 * 1024 * 1024 + 1),
      };

      await expect(service.addAttachment(requestId, customerId, file, {})).rejects.toThrow(
        AttachmentTooLargeException,
      );
    });

    it('should throw when file type is not supported', async () => {
      const customerId = 'customer-1';
      const requestId = 'request-1';

      const request: ServiceRequest = {
        id: requestId,
        customerId,
        addressId: null,
        rawText: 'I need help',
        voiceUrl: null,
        media: null as unknown as Prisma.JsonValue,
        aiCategory: null,
        aiConfidence: null,
        status: 'DRAFT',
        createdAt: new Date(),
      };

      mockPrisma.serviceRequest.findUnique.mockResolvedValue({
        ...request,
        address: null,
        bookings: [],
      });

      const file: UploadedAttachmentFile = {
        originalname: 'document.txt',
        mimetype: 'text/plain',
        size: 1024,
        buffer: Buffer.from('some text'),
      };

      await expect(service.addAttachment(requestId, customerId, file, {})).rejects.toThrow(
        UnsupportedAttachmentTypeException,
      );
    });
  });

  describe('transcribeAudio', () => {
    const mockFile: UploadedAttachmentFile = {
      originalname: 'voice.m4a',
      mimetype: 'audio/m4a',
      size: 1024,
      buffer: Buffer.from('mock-audio-data'),
    };

    it('throws TranscriptionUnavailableException when localTranscriptionUrl is not configured', async () => {
      await expect(service.transcribeAudio(mockFile)).rejects.toThrow(
        TranscriptionUnavailableException,
      );
    });

    it('throws TranscriptionUnavailableException when local transcription server is unreachable', async () => {
      const configWithUrl = {
        transcriptionProvider: 'local',
        localTranscriptionUrl: 'http://127.0.0.1:9000/v1/audio/transcriptions',
      } as unknown as AppConfigService;

      const module = await Test.createTestingModule({
        providers: [
          ServiceRequestsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: DOCUMENT_STORAGE, useValue: mockStorage },
          { provide: AppConfigService, useValue: configWithUrl },
        ],
      }).compile();

      const serviceWithUrl = module.get<ServiceRequestsService>(ServiceRequestsService);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      try {
        await expect(serviceWithUrl.transcribeAudio(mockFile)).rejects.toThrow(
          TranscriptionUnavailableException,
        );
      } finally {
        globalThis.fetch = originalFetch;
      }
    });

    it('returns transcript when transcription server responds with text', async () => {
      const configWithUrl = {
        transcriptionProvider: 'local',
        localTranscriptionUrl: 'http://127.0.0.1:9000/v1/audio/transcriptions',
      } as unknown as AppConfigService;

      const module = await Test.createTestingModule({
        providers: [
          ServiceRequestsService,
          { provide: PrismaService, useValue: mockPrisma },
          { provide: DOCUMENT_STORAGE, useValue: mockStorage },
          { provide: AppConfigService, useValue: configWithUrl },
        ],
      }).compile();

      const serviceWithUrl = module.get<ServiceRequestsService>(ServiceRequestsService);

      const originalFetch = globalThis.fetch;
      globalThis.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ text: 'My AC is not cooling properly' }),
      } as Response);

      try {
        const transcript = await serviceWithUrl.transcribeAudio(mockFile);
        expect(transcript).toBe('My AC is not cooling properly');
      } finally {
        globalThis.fetch = originalFetch;
      }
    });
  });
});
