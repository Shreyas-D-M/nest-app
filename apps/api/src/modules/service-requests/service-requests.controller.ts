import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '@prisma/client';
import type { ServiceRequestView } from '@nest/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MAX_DOCUMENT_BYTES } from '../storage/document-storage';
import { ServiceRequestCreateDto, ServiceRequestAttachmentDto } from './service-requests.dto';
import { AttachmentFileRequiredException } from './service-requests.exceptions';
import { toServiceRequestView } from './service-requests.mapper';
import { ServiceRequestsService, type UploadedAttachmentFile } from './service-requests.service';

/**
 * `/service-requests` endpoints from 06_API_SPEC.md.
 *
 * Every route acts on the caller's own service requests. Customer ownership
 * is enforced in the service layer.
 */
@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private readonly serviceRequests: ServiceRequestsService) {}

  /**
   * POST /service-requests — create a new service request.
   *
   * Customer submits their service need in natural language. Optional address
   * and media can be provided upfront.
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentUser() user: User,
    @Body() dto: ServiceRequestCreateDto,
  ): Promise<ServiceRequestView> {
    const request = await this.serviceRequests.create(user.id, dto);

    return toServiceRequestView(request);
  }

  /**
   * GET /service-requests/:id — retrieve a service request.
   *
   * Customer can only access their own service requests. Returns 404 if the
   * request doesn't exist or belongs to another customer.
   */
  @Get(':id')
  async getById(@CurrentUser() user: User, @Param('id') id: string): Promise<ServiceRequestView> {
    const request = await this.serviceRequests.getById(id, user.id);

    return toServiceRequestView(request);
  }

  /**
   * POST /service-requests/:id/attachments — add a photo attachment.
   *
   * Customer can upload photos to provide visual context for their service
   * request. The file is stored and its URL is appended to the media array.
   */
  @Post(':id/attachments')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES } }))
  async addAttachment(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: ServiceRequestAttachmentDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ServiceRequestView> {
    if (file === undefined) {
      throw new AttachmentFileRequiredException();
    }

    const uploadedFile: UploadedAttachmentFile = {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    };

    const request = await this.serviceRequests.addAttachment(id, user.id, uploadedFile, dto);

    return toServiceRequestView(request);
  }

  @Post('transcribe')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: MAX_DOCUMENT_BYTES } }))
  async transcribe(
    @CurrentUser() _user: User,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<{ transcript: string }> {
    if (file === undefined) {
      throw new AttachmentFileRequiredException();
    }

    const transcript = await this.serviceRequests.transcribeAudio(file);
    return { transcript };
  }
}
