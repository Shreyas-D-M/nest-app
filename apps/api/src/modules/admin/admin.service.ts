import { Inject, Injectable, Logger } from '@nestjs/common';
import { Prisma, type Professional } from '@prisma/client';
import { AUDIT_ACTIONS, type VerificationStatus } from '@nest/types';
import type {
  AdminApprovalInput,
  AdminAuditLogQueryInput,
  AdminCreateServiceInput,
  AdminProfessionalListQueryInput,
  AdminReviewDecisionInput,
  AdminUpdateServiceInput,
} from '@nest/validation';
import { AuditService } from '../../common/audit/audit.service';
import { ResourceNotFoundException } from '../../common/errors/api-exception';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaService } from '../../prisma/prisma.service';
import { canTransition } from '../../domain/verification/verification-transitions';
import { DOCUMENT_STORAGE, type DocumentStorage } from '../storage/document-storage';
import { InvalidVerificationTransitionException } from '../professionals/professionals.exceptions';

/**
 * Admin operations.
 *
 * Every mutation writes an audit row **inside the same transaction** as the change
 * it records (06_API_SPEC.md: audit admin actions). An audit trail that can drift
 * from reality is worse than none, because people rely on it.
 *
 * Verification decisions run through the domain state machine rather than setting
 * a column directly, so an illegal jump — approving a profile that was never
 * submitted, say — is impossible rather than merely unlikely.
 */

const ADMIN_PROFESSIONAL_INCLUDE = {
  user: { select: { id: true, phone: true, name: true, email: true } },
  documents: { orderBy: { createdAt: 'desc' } },
  serviceAreas: true,
  _count: { select: { documents: true } },
} satisfies Prisma.ProfessionalInclude;

export type AdminProfessionalRecord = Prisma.ProfessionalGetPayload<{
  include: typeof ADMIN_PROFESSIONAL_INCLUDE;
}>;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly config: AppConfigService,
    @Inject(DOCUMENT_STORAGE) private readonly storage: DocumentStorage,
  ) {}

  // --- Verification queue ---------------------------------------------------

  async listProfessionals(
    query: AdminProfessionalListQueryInput,
  ): Promise<{ items: AdminProfessionalRecord[]; total: number }> {
    const where: Prisma.ProfessionalWhereInput =
      query.verificationStatus === undefined
        ? {}
        : { verificationStatus: query.verificationStatus };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.professional.findMany({
        where,
        include: ADMIN_PROFESSIONAL_INCLUDE,
        // Oldest first: a verification queue should be worked in the order people
        // joined it, not newest-first.
        orderBy: { createdAt: 'asc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.professional.count({ where }),
    ]);

    return { items, total };
  }

  async getProfessional(id: string): Promise<AdminProfessionalRecord> {
    const professional = await this.prisma.professional.findUnique({
      where: { id },
      include: ADMIN_PROFESSIONAL_INCLUDE,
    });

    if (professional === null) {
      throw new ResourceNotFoundException('Professional not found.');
    }

    return professional;
  }

  /**
   * Mints short-lived URLs for an applicant's documents.
   *
   * Generated per request rather than stored, so a cached admin response cannot be
   * replayed later to reach someone's identity papers.
   */
  async signDocumentUrls(
    professional: AdminProfessionalRecord,
  ): Promise<Map<string, { url: string; expiresAt: Date }>> {
    const signed = new Map<string, { url: string; expiresAt: Date }>();

    for (const document of professional.documents) {
      signed.set(
        document.id,
        await this.storage.signedUrl(document.storageUrl, this.config.documentUrlTtlSeconds),
      );
    }

    return signed;
  }

  approve(id: string, adminId: string, input: AdminApprovalInput): Promise<Professional> {
    return this.decide({
      id,
      adminId,
      to: 'APPROVED',
      action: AUDIT_ACTIONS.PROFESSIONAL_APPROVE,
      notes: input.notes ?? null,
    });
  }

  reject(id: string, adminId: string, input: AdminReviewDecisionInput): Promise<Professional> {
    return this.decide({
      id,
      adminId,
      to: 'REJECTED',
      action: AUDIT_ACTIONS.PROFESSIONAL_REJECT,
      notes: input.reason,
    });
  }

  requestChanges(
    id: string,
    adminId: string,
    input: AdminReviewDecisionInput,
  ): Promise<Professional> {
    return this.decide({
      id,
      adminId,
      to: 'CHANGES_REQUESTED',
      action: AUDIT_ACTIONS.PROFESSIONAL_REQUEST_CHANGES,
      notes: input.reason,
    });
  }

  /**
   * Applies a verification decision.
   *
   * Rejecting or requesting changes also forces the professional offline: leaving
   * a no-longer-approved professional online would let them take work they are not
   * verified for, which is precisely what CLAUDE.md prohibits.
   */
  private async decide(params: {
    id: string;
    adminId: string;
    to: VerificationStatus;
    action: string;
    notes: string | null;
  }): Promise<Professional> {
    const professional = await this.prisma.professional.findUnique({ where: { id: params.id } });

    if (professional === null) {
      throw new ResourceNotFoundException('Professional not found.');
    }

    if (!canTransition(professional.verificationStatus, params.to)) {
      throw new InvalidVerificationTransitionException(professional.verificationStatus, params.to);
    }

    const now = new Date();

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.professional.update({
        where: { id: params.id },
        data: {
          verificationStatus: params.to,
          reviewNotes: params.notes,
          reviewedById: params.adminId,
          reviewedAt: now,
          onlineStatus: params.to === 'APPROVED' ? professional.onlineStatus : 'OFFLINE',
        },
      });

      await this.audit.record(
        {
          actorId: params.adminId,
          action: params.action,
          entityType: 'professional',
          entityId: params.id,
          before: { verificationStatus: professional.verificationStatus },
          after: { verificationStatus: params.to },
        },
        tx,
      );

      return result;
    });

    this.logger.log(
      `Professional ${params.id} moved ${professional.verificationStatus} → ${params.to}`,
    );

    return updated;
  }

  // --- Service management ---------------------------------------------------

  async listServices(query: { limit: number; offset: number }) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({
        include: { category: true },
        orderBy: [{ category: { sortOrder: 'asc' } }, { name: 'asc' }],
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.service.count(),
    ]);

    return { items, total };
  }

  async createService(adminId: string, input: AdminCreateServiceInput) {
    const category = await this.prisma.category.findUnique({ where: { id: input.categoryId } });

    if (category === null) {
      throw new ResourceNotFoundException('Category not found.');
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.create({
        data: {
          categoryId: input.categoryId,
          name: input.name,
          slug: input.slug,
          description: input.description ?? null,
          pricingType: input.pricingType,
          basePriceMinor: input.basePriceMinor ?? null,
          active: input.active ?? true,
        },
        include: { category: true },
      });

      await this.audit.record(
        {
          actorId: adminId,
          action: AUDIT_ACTIONS.SERVICE_CREATE,
          entityType: 'service',
          entityId: service.id,
          after: {
            name: service.name,
            slug: service.slug,
            pricingType: service.pricingType,
            basePriceMinor: service.basePriceMinor,
            active: service.active,
          },
        },
        tx,
      );

      return service;
    });
  }

  async updateService(id: string, adminId: string, patch: AdminUpdateServiceInput) {
    const existing = await this.prisma.service.findUnique({ where: { id } });

    if (existing === null) {
      throw new ResourceNotFoundException('Service not found.');
    }

    const data: Prisma.ServiceUpdateInput = {};

    if (patch.categoryId !== undefined) {
      const category = await this.prisma.category.findUnique({ where: { id: patch.categoryId } });

      if (category === null) {
        throw new ResourceNotFoundException('Category not found.');
      }

      data.category = { connect: { id: patch.categoryId } };
    }

    if (patch.name !== undefined) {
      data.name = patch.name;
    }

    if (patch.description !== undefined) {
      data.description = patch.description;
    }

    if (patch.pricingType !== undefined) {
      data.pricingType = patch.pricingType;
    }

    if (patch.basePriceMinor !== undefined) {
      data.basePriceMinor = patch.basePriceMinor;
    }

    if (patch.active !== undefined) {
      data.active = patch.active;
    }

    return this.prisma.$transaction(async (tx) => {
      const service = await tx.service.update({
        where: { id },
        data,
        include: { category: true },
      });

      await this.audit.record(
        {
          actorId: adminId,
          action: AUDIT_ACTIONS.SERVICE_UPDATE,
          entityType: 'service',
          entityId: id,
          before: {
            name: existing.name,
            pricingType: existing.pricingType,
            basePriceMinor: existing.basePriceMinor,
            active: existing.active,
          },
          after: {
            name: service.name,
            pricingType: service.pricingType,
            basePriceMinor: service.basePriceMinor,
            active: service.active,
          },
        },
        tx,
      );

      return service;
    });
  }

  // --- Audit trail ----------------------------------------------------------

  async listAuditLogs(query: AdminAuditLogQueryInput) {
    const where: Prisma.AuditLogWhereInput = {};

    if (query.entityType !== undefined) {
      where.entityType = query.entityType;
    }

    if (query.entityId !== undefined) {
      where.entityId = query.entityId;
    }

    if (query.actorId !== undefined) {
      where.actorId = query.actorId;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: query.limit,
        skip: query.offset,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return { items, total };
  }
}
