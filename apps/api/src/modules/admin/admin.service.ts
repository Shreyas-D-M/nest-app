import { Inject, Injectable, Logger } from '@nestjs/common';
import {
  Prisma,
  type Professional,
  PaymentStatus,
  BookingStatus,
  UserStatus,
} from '@prisma/client';
import { AUDIT_ACTIONS, type VerificationStatus } from '@nest/types';
import type {
  AdminApprovalInput,
  AdminAuditLogQueryInput,
  AdminCreateServiceInput,
  AdminProfessionalListQueryInput,
  AdminReviewDecisionInput,
  AdminUpdateServiceInput,
  AdminListQueryInput,
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

  // --- Booking Management -----------------------------------------------------

  async listBookings(
    query: AdminListQueryInput & {
      status?: string;
      customerId?: string;
      professionalId?: string;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const { limit, offset, status, customerId, professionalId, fromDate, toDate } = query;
    const where: Prisma.BookingWhereInput = {};

    if (status) where.status = status as BookingStatus;
    if (customerId) where.customerId = customerId;
    if (professionalId) where.professionalId = professionalId;
    if (fromDate || toDate) {
      where.scheduledStart = {};
      if (fromDate) where.scheduledStart.gte = new Date(fromDate);
      if (toDate) where.scheduledStart.lte = new Date(toDate);
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.booking.findMany({
        where,
        include: {
          customer: { select: { id: true, phone: true, name: true, email: true } },
          professional: {
            select: {
              id: true,
              phone: true,
              name: true,
              email: true,
            },
            include: {
              professional: { select: { businessName: true } },
            },
          },
          service: { select: { id: true, name: true, slug: true } },
          address: {
            select: { id: true, addressLine: true, locality: true, city: true, pincode: true },
          },
          payment: {
            select: { id: true, status: true, amountMinor: true, providerPaymentId: true },
          },
          review: { select: { id: true, rating: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { items, total };
  }

  async getBooking(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, phone: true, name: true, email: true } },
        professional: {
          select: {
            id: true,
            phone: true,
            name: true,
            email: true,
          },
          include: {
            professional: { select: { businessName: true } },
          },
        },
        service: { select: { id: true, name: true, slug: true } },
        address: {
          select: {
            id: true,
            addressLine: true,
            locality: true,
            city: true,
            pincode: true,
            instructions: true,
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'asc' },
          select: {
            id: true,
            status: true,
            actorType: true,
            actorId: true,
            metadata: true,
            createdAt: true,
          },
        },
        items: true,
        extraWorkReqs: {
          include: { professional: { select: { name: true } } },
        },
        payment: {
          include: {
            refunds: { select: { id: true, amountMinor: true, status: true, createdAt: true } },
          },
        },
        review: true,
        invoice: true,
      },
    });

    if (!booking) {
      throw new ResourceNotFoundException('Booking not found');
    }

    return booking;
  }

  async cancelBooking(id: string, adminId: string, reason: string) {
    const booking = await this.prisma.booking.findUnique({ where: { id } });

    if (!booking) {
      throw new ResourceNotFoundException('Booking not found');
    }

    if (
      booking.status === 'CANCELLED_BY_CUSTOMER' ||
      booking.status === 'CANCELLED_BY_PROFESSIONAL' ||
      booking.status === 'CANCELLED_BY_ADMIN'
    ) {
      throw new Error('Booking already cancelled');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.booking.update({
        where: { id },
        data: { status: 'CANCELLED_BY_ADMIN' },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId: id,
          status: 'CANCELLED_BY_ADMIN',
          actorType: 'ADMIN',
          actorId: adminId,
          metadata: { reason },
        },
      });

      await this.audit.record(
        {
          actorId: adminId,
          action: 'booking.admin_cancel',
          entityType: 'booking',
          entityId: id,
          before: { status: booking.status },
          after: { status: 'CANCELLED_BY_ADMIN', reason },
        },
        tx,
      );

      return result;
    });

    return updated;
  }

  // --- Customer Management ----------------------------------------------------

  async listCustomers(query: AdminListQueryInput & { status?: string; search?: string }) {
    const { limit, offset, status, search } = query;
    const where: Prisma.UserWhereInput = { role: 'CUSTOMER' };

    if (status) where.status = status as UserStatus;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          phone: true,
          name: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          _count: { select: { customerBookings: true, addresses: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items, total };
  }

  async getCustomer(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        addresses: { where: { deletedAt: null }, orderBy: { createdAt: 'desc' } },
        customerBookings: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            service: { select: { name: true } },
            professional: { select: { professional: { select: { businessName: true } } } },
            payment: { select: { status: true, amountMinor: true } },
          },
        },
      },
    });

    if (!user || user.role !== 'CUSTOMER') {
      throw new ResourceNotFoundException('Customer not found');
    }

    return user;
  }

  async updateCustomerStatus(
    id: string,
    adminId: string,
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED',
  ) {
    const customer = await this.prisma.user.findUnique({ where: { id } });

    if (!customer || customer.role !== 'CUSTOMER') {
      throw new ResourceNotFoundException('Customer not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.user.update({
        where: { id },
        data: { status },
      });

      await this.audit.record(
        {
          actorId: adminId,
          action: 'customer.status_update',
          entityType: 'user',
          entityId: id,
          before: { status: customer.status },
          after: { status },
        },
        tx,
      );

      return result;
    });

    return updated;
  }

  // --- Payment Management -----------------------------------------------------

  async listPayments(
    query: AdminListQueryInput & {
      status?: string;
      provider?: string;
      fromDate?: string;
      toDate?: string;
      minAmount?: number;
      maxAmount?: number;
    },
  ) {
    const { limit, offset, status, provider, fromDate, toDate, minAmount, maxAmount } = query;
    const where: Prisma.PaymentWhereInput = {};

    if (status) where.status = status as PaymentStatus;
    if (provider) where.provider = provider;
    if (fromDate || toDate) {
      where.createdAt = {};
      if (fromDate) where.createdAt.gte = new Date(fromDate);
      if (toDate) where.createdAt.lte = new Date(toDate);
    }
    if (minAmount !== undefined || maxAmount !== undefined) {
      where.amountMinor = {};
      if (minAmount !== undefined) where.amountMinor.gte = minAmount;
      if (maxAmount !== undefined) where.amountMinor.lte = maxAmount;
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.payment.findMany({
        where,
        include: {
          booking: {
            select: {
              id: true,
              customerId: true,
              professionalId: true,
              service: { select: { name: true } },
              scheduledStart: true,
            },
          },
          refunds: { select: { id: true, amountMinor: true, status: true, createdAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.payment.count({ where }),
    ]);

    return { items, total };
  }

  async getPayment(id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            customer: { select: { id: true, phone: true, name: true, email: true } },
            professional: {
              select: {
                id: true,
                phone: true,
                name: true,
                email: true,
              },
              include: {
                professional: { select: { businessName: true } },
              },
            },
            service: { select: { id: true, name: true, slug: true } },
          },
        },
        refunds: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!payment) {
      throw new ResourceNotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(id: string, adminId: string, body: { amountMinor?: number; reason: string }) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { refunds: true },
    });

    if (!payment) {
      throw new ResourceNotFoundException('Payment not found');
    }

    if (payment.status !== 'COMPLETED') {
      throw new Error('Can only refund completed payments');
    }

    const totalRefunded = payment.refunds
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.amountMinor, 0);

    const refundAmount = body.amountMinor ?? payment.amountMinor - totalRefunded;

    if (refundAmount <= 0) {
      throw new Error('No amount available to refund');
    }

    if (totalRefunded + refundAmount > payment.amountMinor) {
      throw new Error('Refund amount exceeds payment amount');
    }

    const refund = await this.prisma.$transaction(async (tx) => {
      const result = await tx.paymentRefund.create({
        data: {
          paymentId: id,
          amountMinor: refundAmount,
          status: 'PENDING',
          reason: body.reason,
        },
      });

      await this.audit.record(
        {
          actorId: adminId,
          action: 'payment.refund_initiated',
          entityType: 'payment',
          entityId: id,
          before: { status: payment.status, amountMinor: payment.amountMinor },
          after: { refundId: result.id, refundAmountMinor: refundAmount, reason: body.reason },
        },
        tx,
      );

      return result;
    });

    return refund;
  }

  // --- Platform Statistics ----------------------------------------------------

  async getStats() {
    const [
      totalCustomers,
      totalProfessionals,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenueMinor,
      pendingPayments,
      failedPayments,
      openTickets,
      professionalsByStatus,
      bookingsByStatus,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.professional.count(),
      this.prisma.booking.count(),
      this.prisma.booking.count({ where: { status: 'COMPLETED' } }),
      this.prisma.booking.count({
        where: {
          status: {
            in: ['CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'CANCELLED_BY_ADMIN'],
          },
        },
      }),
      this.prisma.payment.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amountMinor: true },
      }),
      this.prisma.payment.count({ where: { status: 'PENDING' } }),
      this.prisma.payment.count({ where: { status: 'FAILED' } }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'WAITING_INTERNAL'] } },
      }),
      this.prisma.professional.groupBy({ by: ['verificationStatus'], _count: true }),
      this.prisma.booking.groupBy({ by: ['status'], _count: true }),
    ]);

    return {
      users: {
        totalCustomers,
        totalProfessionals,
        professionalsByStatus: professionalsByStatus.reduce((acc: Record<string, number>, p) => {
          acc[p.verificationStatus] = p._count;
          return acc;
        }, {}),
      },
      bookings: {
        total: totalBookings,
        completed: completedBookings,
        cancelled: cancelledBookings,
        byStatus: bookingsByStatus.reduce((acc: Record<string, number>, b) => {
          acc[b.status] = b._count;
          return acc;
        }, {}),
      },
      payments: {
        totalRevenueMinor: totalRevenueMinor._sum.amountMinor ?? 0,
        pending: pendingPayments,
        failed: failedPayments,
      },
      support: {
        openTickets,
      },
    };
  }
}
