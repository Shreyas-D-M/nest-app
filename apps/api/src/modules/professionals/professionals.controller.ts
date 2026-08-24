import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { User } from '@prisma/client';
import type {
  AvailabilityWindow,
  ProfessionalDocumentSummary,
  ProfessionalProfile,
  ProfessionalServiceOffering,
} from '@nest/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { MAX_DOCUMENT_BYTES } from '../storage/document-storage';
import {
  ProfessionalAvailabilityUpdateDto,
  ProfessionalDocumentDto,
  ProfessionalOnboardingDto,
  ProfessionalProfileUpdateDto,
  ProfessionalServicesUpdateDto,
  ProfessionalStatusDto,
} from './professionals.dto';
import { DocumentFileRequiredException } from './professionals.exceptions';
import {
  toAvailabilityWindow,
  toDocumentSummary,
  toProfessionalProfile,
} from './professionals.mapper';
import { ProfessionalsService, type UploadedDocumentFile } from './professionals.service';

/**
 * `/professional/*` endpoints from 06_API_SPEC.md.
 *
 * Every route acts on the caller's own professional record, resolved from the
 * access token — no professional id is ever accepted from the client, so there is
 * no object-level authorization to get wrong.
 *
 * No `@Roles()` here on purpose. The meaningful requirement is "has a professional
 * record", which the service enforces, not "has the PROFESSIONAL role" — the two
 * can diverge, and the record is the authority.
 */
@Controller('professional')
export class ProfessionalsController {
  constructor(private readonly professionals: ProfessionalsService) {}

  @Post('onboarding')
  @HttpCode(HttpStatus.CREATED)
  async onboard(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalOnboardingDto,
  ): Promise<ProfessionalProfile> {
    return toProfessionalProfile(await this.professionals.onboard(user.id, dto));
  }

  @Get('profile')
  async getProfile(@CurrentUser() user: User): Promise<ProfessionalProfile> {
    return toProfessionalProfile(await this.professionals.requireOwnProfile(user.id));
  }

  @Patch('profile')
  async updateProfile(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalProfileUpdateDto,
  ): Promise<ProfessionalProfile> {
    return toProfessionalProfile(await this.professionals.updateOwnProfile(user.id, dto));
  }

  @Get('services')
  async getServices(@CurrentUser() user: User): Promise<ProfessionalServiceOffering[]> {
    const profile = toProfessionalProfile(await this.professionals.requireOwnProfile(user.id));

    return profile.services;
  }

  @Put('services')
  async replaceServices(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalServicesUpdateDto,
  ): Promise<ProfessionalServiceOffering[]> {
    const updated = await this.professionals.replaceOwnServices(user.id, dto);

    return toProfessionalProfile(updated).services;
  }

  @Get('availability')
  async getAvailability(@CurrentUser() user: User): Promise<AvailabilityWindow[]> {
    const professional = await this.professionals.requireOwnProfile(user.id);

    return (professional.availability ?? [])
      .filter((window) => window.active)
      .map(toAvailabilityWindow);
  }

  @Put('availability')
  async replaceAvailability(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalAvailabilityUpdateDto,
  ): Promise<AvailabilityWindow[]> {
    const updated = await this.professionals.replaceOwnAvailability(user.id, dto);

    return (updated.availability ?? []).filter((window) => window.active).map(toAvailabilityWindow);
  }

  @Post('status')
  @HttpCode(HttpStatus.OK)
  async setStatus(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalStatusDto,
  ): Promise<ProfessionalProfile> {
    return toProfessionalProfile(await this.professionals.setOwnStatus(user.id, dto));
  }

  /**
   * Uploads one verification document.
   *
   * Multipart, so the metadata arrives as form fields alongside the file. Multer's
   * own size limit is set as well as the service-level check: rejecting an
   * oversized upload while it streams is cheaper than buffering it first.
   */
  @Post('documents')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_DOCUMENT_BYTES, files: 1 } }))
  async addDocument(
    @CurrentUser() user: User,
    @Body() dto: ProfessionalDocumentDto,
    @UploadedFile() file: UploadedDocumentFile | undefined,
  ): Promise<ProfessionalDocumentSummary> {
    if (file === undefined) {
      throw new DocumentFileRequiredException();
    }

    return toDocumentSummary(await this.professionals.addOwnDocument(user.id, dto, file));
  }
}
