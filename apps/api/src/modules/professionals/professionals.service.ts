import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, type ProfessionalDocument } from '@prisma/client';
import type {
  ProfessionalAvailabilityUpdateInput,
  ProfessionalDocumentInput,
  ProfessionalOnboardingInput,
  ProfessionalProfileUpdateInput,
  ProfessionalServicesUpdateInput,
  ProfessionalStatusInput,
} from '@nest/validation';
import { ResourceNotFoundException } from '../../common/errors/api-exception';
import { PrismaService } from '../../prisma/prisma.service';
import { canGoOnline, isPubliclyVisible } from '../../domain/verification/verification-transitions';
import { AppConfigService } from '../../config/app-config.service';
import {
  ALLOWED_DOCUMENT_CONTENT_TYPES,
  DOCUMENT_STORAGE,
  MAX_DOCUMENT_BYTES,
  type DocumentStorage,
} from '../storage/document-storage';
import {
  AlreadyAProfessionalException,
  DocumentTooLargeException,
  NotAProfessionalException,
  UnsupportedDocumentTypeException,
  VerificationRequiredException,
} from './professionals.exceptions';
import type { ProfessionalWithRelations } from './professionals.mapper';

/**
 * Professional supply-side operations.
 *
 * Ownership rule, as in Phase 1: every write is scoped to the caller's own
 * professional record, resolved from the access token. No endpoint accepts a
 * professional id from the client.
 */

/** Uploaded file, typed locally to avoid depending on multer's type package. */
export interface UploadedDocumentFile {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

const PROFESSIONAL_INCLUDE = {
  services: { include: { service: true } },
  serviceAreas: true,
  availability: true,
  documents: { orderBy: { createdAt: 'desc' } },
} satisfies Prisma.ProfessionalInclude;

@Injectable()
export class ProfessionalsService {
  private readonly logger = new Logger(ProfessionalsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfigService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  /**
   * Creates the professional record and marks the user as a professional.
   *
   * The role change and the record are one transaction: a user marked
   * PROFESSIONAL without a professional record would be able to reach professional
   * endpoints that then fail to find their profile.
   *
   * The user keeps every customer capability — `/me`, addresses, and later
   * bookings are keyed to the user, not to the role.
   *
   * @throws AlreadyAProfessionalException — onboarding is once per user
   * (users 1—0/1 professional).
   */
  async onboard(userId: string, input: ProfessionalOnboardingInput): Promise<ProfessionalWithRelations> {
    const existing = await this.prisma.professional.findUnique({ where: { userId } });

    if (existing !== null) {
      throw new AlreadyAProfessionalException();
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const professional = await tx.professional.create({
          data: {
            userId,
            businessName: input.businessName,
            bio: input.bio ?? null,
            yearsExperience: input.yearsExperience,
            serviceAreas: {
              create: input.serviceAreas.map((area) => ({
                locality: area.locality,
                pincode: area.pincode,
              })),
            },
          },
          include: PROFESSIONAL_INCLUDE,
        });

        await tx.user.update({ where: { id: userId }, data: { role: 'PROFESSIONAL' } });

        return professional;
      });
    } catch (error) {
      // Two concurrent onboarding requests: the unique index on user_id decides.
      if (isUniqueViolation(error)) {
        throw new AlreadyAProfessionalException();
      }

      throw error;
    }
  }

  /** @throws NotAProfessionalException when the caller has no professional record. */
  async requireOwnProfile(userId: string): Promise<ProfessionalWithRelations> {
    const professional = await this.prisma.professional.findUnique({
      where: { userId },
      include: PROFESSIONAL_INCLUDE,
    });

    if (professional === null) {
      throw new NotAProfessionalException();
    }

    return professional;
  }

  /**
   * Updates profile fields, and service areas when supplied.
   *
   * Service areas are replaced wholesale rather than patched: 06_API_SPEC.md
   * defines no service-area endpoint, so this is the documented way to manage
   * them, and a full replacement matches how the onboarding screen collects them.
   */
  async updateOwnProfile(
    userId: string,
    patch: ProfessionalProfileUpdateInput,
  ): Promise<ProfessionalWithRelations> {
    const professional = await this.requireOwnProfile(userId);

    const data: Prisma.ProfessionalUpdateInput = {};

    if (patch.businessName !== undefined) {
      data.businessName = patch.businessName;
    }

    if (patch.bio !== undefined) {
      data.bio = patch.bio;
    }

    if (patch.yearsExperience !== undefined) {
      data.yearsExperience = patch.yearsExperience;
    }

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(data).length > 0) {
        await tx.professional.update({ where: { id: professional.id }, data });
      }

      if (patch.serviceAreas !== undefined) {
        await tx.professionalServiceArea.deleteMany({
          where: { professionalId: professional.id },
        });
        await tx.professionalServiceArea.createMany({
          data: patch.serviceAreas.map((area) => ({
            professionalId: professional.id,
            locality: area.locality,
            pincode: area.pincode,
          })),
        });
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: professional.id },
        include: PROFESSIONAL_INCLUDE,
      });
    });
  }

  /**
   * Replaces the professional's service list.
   *
   * `PUT` semantics: what is sent is what they offer. Every referenced service
   * must exist and be active, so a professional cannot list a withdrawn service.
   */
  async replaceOwnServices(
    userId: string,
    input: ProfessionalServicesUpdateInput,
  ): Promise<ProfessionalWithRelations> {
    const professional = await this.requireOwnProfile(userId);
    const serviceIds = input.services.map((service) => service.serviceId);

    if (serviceIds.length > 0) {
      const found = await this.prisma.service.count({
        where: { id: { in: serviceIds }, active: true },
      });

      if (found !== serviceIds.length) {
        throw new ResourceNotFoundException('One or more services were not found.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.professionalService.deleteMany({ where: { professionalId: professional.id } });

      if (input.services.length > 0) {
        await tx.professionalService.createMany({
          data: input.services.map((service) => ({
            professionalId: professional.id,
            serviceId: service.serviceId,
            basePriceMinor: service.basePriceMinor,
            pricingType: service.pricingType,
          })),
        });
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: professional.id },
        include: PROFESSIONAL_INCLUDE,
      });
    });
  }

  /** Replaces the weekly availability windows. */
  async replaceOwnAvailability(
    userId: string,
    input: ProfessionalAvailabilityUpdateInput,
  ): Promise<ProfessionalWithRelations> {
    const professional = await this.requireOwnProfile(userId);

    return this.prisma.$transaction(async (tx) => {
      await tx.professionalAvailability.deleteMany({
        where: { professionalId: professional.id },
      });

      if (input.windows.length > 0) {
        await tx.professionalAvailability.createMany({
          data: input.windows.map((window) => ({
            professionalId: professional.id,
            weekday: window.weekday,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
          })),
        });
      }

      return tx.professional.findUniqueOrThrow({
        where: { id: professional.id },
        include: PROFESSIONAL_INCLUDE,
      });
    });
  }

  /**
   * Sets online or offline.
   *
   * Going ONLINE requires completed verification: an unverified professional
   * accepting work is exactly the "claiming verification" failure CLAUDE.md
   * prohibits. Going OFFLINE is always allowed — nobody should be trapped online.
   *
   * @throws VerificationRequiredException when attempting to go online unverified.
   */
  async setOwnStatus(
    userId: string,
    input: ProfessionalStatusInput,
  ): Promise<ProfessionalWithRelations> {
    const professional = await this.requireOwnProfile(userId);

    if (input.onlineStatus === 'ONLINE' && !canGoOnline(professional.verificationStatus)) {
      throw new VerificationRequiredException(professional.verificationStatus);
    }

    return this.prisma.professional.update({
      where: { id: professional.id },
      data: { onlineStatus: input.onlineStatus },
      include: PROFESSIONAL_INCLUDE,
    });
  }

  /**
   * Stores a verification document and moves the profile into review.
   *
   * The transition to PENDING_REVIEW happens here rather than in a separate
   * "submit" step because 06_API_SPEC.md defines no such endpoint: uploading a
   * document *is* the submission.
   *
   * An already-APPROVED professional uploading a document (a renewed licence, say)
   * does not lose their approval — the file is recorded for review without
   * revoking anything.
   */
  async addOwnDocument(
    userId: string,
    input: ProfessionalDocumentInput,
    file: UploadedDocumentFile,
  ): Promise<ProfessionalDocument> {
    const professional = await this.requireOwnProfile(userId);

    assertAcceptableDocument(file);

    const stored = await this.storage.put({
      professionalId: professional.id,
      documentType: input.documentType,
      originalFilename: file.originalname,
      contentType: file.mimetype,
      body: file.buffer,
    });

    const document = await this.prisma.$transaction(async (tx) => {
      const created = await tx.professionalDocument.create({
        data: {
          professionalId: professional.id,
          documentType: input.documentType,
          storageUrl: stored.key,
          expiresAt: input.expiresAt === undefined || input.expiresAt === null
            ? null
            : new Date(input.expiresAt),
        },
      });

      // Submitting evidence puts the application in front of an admin. An approved
      // profile stays approved; only pre-decision states advance.
      if (
        professional.verificationStatus === 'UNSUBMITTED' ||
        professional.verificationStatus === 'CHANGES_REQUESTED' ||
        professional.verificationStatus === 'REJECTED'
      ) {
        await tx.professional.update({
          where: { id: professional.id },
          data: { verificationStatus: 'PENDING_REVIEW' },
        });
      }

      return created;
    });

    this.logger.log(`Document ${input.documentType} recorded for professional ${professional.id}`);

    return document;
  }

  /**
   * A professional as customers see them.
   *
   * Filters on public visibility in the query, so an unverified professional is
   * not merely hidden by the mapper — they are never loaded.
   *
   * @throws ResourceNotFoundException when no publicly visible professional has
   * this id. Unverified and non-existent are indistinguishable to a customer,
   * which is intended: the existence of a pending application is not public.
   */
  async getPublicProfessional(id: string): Promise<ProfessionalWithRelations> {
    const professional = await this.prisma.professional.findFirst({
      where: { id, verificationStatus: 'APPROVED' },
      include: PROFESSIONAL_INCLUDE,
    });

    if (professional === null || !isPubliclyVisible(professional.verificationStatus)) {
      throw new ResourceNotFoundException('Professional not found.');
    }

    return professional;
  }

  /**
   * The timezone that availability windows are expressed in.
   *
   * A client cannot interpret "540" without it, since the windows are wall-clock
   * rules rather than instants.
   */
  getPublicTimezone(): Promise<string> {
    return Promise.resolve(this.config.operatingTimezone);
  }
}

/**
 * Rejects an unacceptable upload before it reaches storage.
 *
 * Both the reported size and the actual buffer length are checked: the reported
 * value is attacker-controlled, so it is a hint, not a fact.
 */
function assertAcceptableDocument(file: UploadedDocumentFile): void {
  const allowed: readonly string[] = ALLOWED_DOCUMENT_CONTENT_TYPES;

  if (!allowed.includes(file.mimetype)) {
    throw new UnsupportedDocumentTypeException(ALLOWED_DOCUMENT_CONTENT_TYPES);
  }

  if (file.size > MAX_DOCUMENT_BYTES || file.buffer.byteLength > MAX_DOCUMENT_BYTES) {
    throw new DocumentTooLargeException(MAX_DOCUMENT_BYTES);
  }
}

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null || !('code' in error)) {
    return false;
  }

  return (error as { code: unknown }).code === 'P2002';
}
