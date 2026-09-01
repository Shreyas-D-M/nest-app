import { Inject, Injectable, Logger } from '@nestjs/common';
import type { ServiceRequest } from '@prisma/client';
import type { ServiceRequestCreateInput, ServiceRequestAttachmentInput } from '@nest/validation';
import { PrismaService } from '../../prisma/prisma.service';
import { AppConfigService } from '../../config/app-config.service';
import {
  DOCUMENT_STORAGE,
  type DocumentStorage,
  MAX_DOCUMENT_BYTES,
  ALLOWED_DOCUMENT_CONTENT_TYPES,
} from '../storage/document-storage';
import {
  ServiceRequestNotFoundException,
  ServiceRequestNotAuthorizedException,
  ServiceRequestAlreadyMatchedException,
  AttachmentTooLargeException,
  UnsupportedAttachmentTypeException,
  TranscriptionUnavailableException,
} from './service-requests.exceptions';

type ServiceRequestWithRelations = ServiceRequest & {
  address: {
    id: string;
    label: string;
    locality: string;
    city: string;
  } | null;
  bookings: Array<{ id: string }>;
};

/**
 * Service request operations.
 *
 * Ownership rule: every read/write is scoped to the caller's own requests.
 * A customer can only see and modify their own service requests.
 */

export interface UploadedAttachmentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export const SERVICE_REQUEST_INCLUDE = {
  address: {
    select: {
      id: true,
      label: true,
      locality: true,
      city: true,
    },
  },
  bookings: {
    select: {
      id: true,
    },
    take: 1,
  },
} as const;

@Injectable()
export class ServiceRequestsService {
  private readonly logger = new Logger(ServiceRequestsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
    private readonly config: AppConfigService,
  ) {}

  /**
   * Creates a new service request from customer input.
   *
   * The request starts in DRAFT status. AI classification can move it to
   * CLARIFYING (needs more info) or READY (ready for matching).
   */
  async create(
    customerId: string,
    input: ServiceRequestCreateInput,
  ): Promise<ServiceRequestWithRelations> {
    // Verify address belongs to customer if provided
    if (input.addressId !== undefined) {
      const address = await this.prisma.userAddress.findFirst({
        where: { id: input.addressId, userId: customerId },
      });

      if (address === null) {
        throw new ServiceRequestNotFoundException();
      }
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        customerId,
        addressId: input.addressId,
        rawText: input.rawText,
        voiceUrl: input.voiceUrl,
        media: input.media ? input.media : undefined,
        status: 'DRAFT',
      },
      include: SERVICE_REQUEST_INCLUDE,
    });

    this.logger.log(`Service request ${request.id} created by customer ${customerId}`);

    return request;
  }

  /**
   * Retrieves a service request by ID.
   *
   * @throws ServiceRequestNotFoundException when request doesn't exist
   * @throws ServiceRequestNotAuthorizedException when request belongs to another customer
   */
  async getById(id: string, customerId: string): Promise<ServiceRequestWithRelations> {
    const request = await this.prisma.serviceRequest.findUnique({
      where: { id },
      include: SERVICE_REQUEST_INCLUDE,
    });

    if (request === null) {
      throw new ServiceRequestNotFoundException();
    }

    if (request.customerId !== customerId) {
      throw new ServiceRequestNotAuthorizedException();
    }

    return request;
  }

  /**
   * Adds a photo attachment to a service request.
   *
   * The attachment is stored using the configured DocumentStorage provider
   * and the storage URL is appended to the request's media array.
   *
   * @throws ServiceRequestNotFoundException when request doesn't exist
   * @throws ServiceRequestNotAuthorizedException when request belongs to another customer
   * @throws ServiceRequestAlreadyMatchedException when request is already matched
   * @throws AttachmentTooLargeException when file exceeds size limit
   * @throws UnsupportedAttachmentTypeException when file type not allowed
   */
  async addAttachment(
    requestId: string,
    customerId: string,
    file: UploadedAttachmentFile,
    _input: ServiceRequestAttachmentInput,
  ): Promise<ServiceRequestWithRelations> {
    const request = await this.getById(requestId, customerId);

    if (request.status === 'MATCHED') {
      throw new ServiceRequestAlreadyMatchedException();
    }

    assertAcceptableAttachment(file);

    // Store the attachment
    const stored = await this.storage.put({
      professionalId: 'service-request', // Not tied to a professional
      documentType: 'IDENTITY_PROOF', // Reusing enum; type doesn't matter for attachments
      originalFilename: file.originalname,
      contentType: file.mimetype,
      body: file.buffer,
    });

    // Append storage URL to media array
    const currentMedia = (request.media as string[] | null) ?? [];
    const updatedMedia = [...currentMedia, stored.key];

    const updated = await this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: { media: updatedMedia },
      include: SERVICE_REQUEST_INCLUDE,
    });

    this.logger.log(`Attachment added to service request ${requestId}`);

    return updated;
  }

  async transcribeAudio(file: UploadedAttachmentFile): Promise<string> {
    const provider = this.getTranscriptionProvider();
    const form = new FormData();
    form.append('file', new Blob([new Uint8Array(file.buffer)], { type: file.mimetype || 'audio/m4a' }), file.originalname || 'voice.m4a');
    form.append('model', provider.model);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let response: Response;
    try {
      response = await fetch(provider.url, {
        method: 'POST',
        headers: provider.apiKey ? { Authorization: `Bearer ${provider.apiKey}` } : undefined,
        body: form,
        signal: controller.signal,
      });
    } catch {
      throw new TranscriptionUnavailableException();
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new TranscriptionUnavailableException();
    const payload = (await response.json().catch(() => null)) as { text?: string } | null;
    const transcript = payload?.text?.trim();

    if (!transcript || transcript.length === 0) {
      throw new TranscriptionUnavailableException();
    }

    return transcript;
  }

  private getTranscriptionProvider(): { url: string; model: string; apiKey?: string } {
    if (this.config.transcriptionProvider === 'openai') {
      if (!this.config.openAiApiKey) throw new TranscriptionUnavailableException();
      return {
        url: 'https://api.openai.com/v1/audio/transcriptions',
        model: 'gpt-4o-mini-transcribe',
        apiKey: this.config.openAiApiKey,
      };
    }
    if (!this.config.localTranscriptionUrl) throw new TranscriptionUnavailableException();
    return { url: this.config.localTranscriptionUrl, model: 'whisper-1' };
  }
}

/**
 * Validates an uploaded attachment before storage.
 *
 * Checks both file size and content type to prevent abuse and ensure
 * compatibility with the storage backend.
 */
function assertAcceptableAttachment(file: UploadedAttachmentFile): void {
  const allowed: readonly string[] = ALLOWED_DOCUMENT_CONTENT_TYPES;

  if (!allowed.includes(file.mimetype)) {
    throw new UnsupportedAttachmentTypeException(ALLOWED_DOCUMENT_CONTENT_TYPES);
  }

  if (file.size > MAX_DOCUMENT_BYTES || file.buffer.byteLength > MAX_DOCUMENT_BYTES) {
    throw new AttachmentTooLargeException(MAX_DOCUMENT_BYTES);
  }
}
