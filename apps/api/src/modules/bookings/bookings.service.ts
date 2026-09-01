import { Inject, Injectable, Logger } from '@nestjs/common';
import type {
  Prisma,
  BookingStatus,
  User,
  Professional,
  Service,
  UserAddress,
  BookingItem,
  ExtraWorkRequest,
  BookingStatusHistory,
} from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PAYMENT_PROVIDER, type PaymentProvider } from '../payments/payment-provider';
import {
  canTransition,
  canBeReviewed,
  isAwaitingPayment,
} from '../../domain/booking/booking-transitions';
import {
  BookingNotFoundException,
  BookingInvalidStatusTransitionException,
  BookingCannotCancelException,
  BookingNotAuthorizedException,
  ProfessionalNotAvailableException,
  SlotNotAvailableException,
  ExtraWorkPendingException,
  PaymentRequiredException,
  AlreadyReviewedException,
} from './bookings.exceptions';
import {
  BookingCreateInput,
  BookingCancelInput,
  ExtraWorkApprovalInput,
  BookingReviewInput,
  ProfessionalJobAcceptInput,
  ProfessionalJobDeclineInput,
  ProfessionalExtraWorkInput,
} from '@nest/validation';

export interface BookingWithRelations {
  id: string;
  customerId: string;
  professionalId: string;
  serviceId: string;
  addressId: string;
  requestId: string | null;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: BookingStatus;
  estimatedAmountMinor: number;
  finalAmountMinor: number | null;
  platformFeeMinor: number | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
  service: Service & { category: { name: string } };
  professional: User & {
    professional: (Professional & { user: Pick<User, 'id' | 'name' | 'phone'> }) | null;
  };
  address: UserAddress;
  items: Array<BookingItem & { quantity: Decimal }>;
  extraWorkReqs: Array<ExtraWorkRequest>;
  statusHistory: Array<BookingStatusHistory>;
  payment: { id: string; status: string } | null;
  review: { id: string } | null;
}

@Injectable()
export class BookingsService {
  private readonly logger = new Logger(BookingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(PAYMENT_PROVIDER) private readonly paymentProvider: PaymentProvider,
  ) {}

  /**
   * Creates a new booking from a service request.
   *
   * Validates professional availability and creates booking in REQUESTED state.
   * Uses transaction to ensure atomic booking creation.
   */
  async create(
    customerId: string,
    input: BookingCreateInput,
    requestId?: string,
  ): Promise<BookingWithRelations> {
    // Verify service exists and is active
    const service = await this.prisma.service.findUnique({
      where: { id: input.serviceId },
      include: { category: true },
    });
    if (!service || !service.active) {
      throw new BookingNotFoundException();
    }

    // Verify professional exists, is verified, and offers this service
    const professional = await this.prisma.professional.findUnique({
      where: { id: input.professionalId },
      include: {
        user: true,
        services: { where: { serviceId: input.serviceId, active: true } },
        serviceAreas: { where: { active: true } },
        availability: { where: { active: true } },
      },
    });
    if (!professional || professional.verificationStatus !== 'APPROVED') {
      throw new ProfessionalNotAvailableException();
    }
    if (professional.services.length === 0) {
      throw new ProfessionalNotAvailableException();
    }

    // Verify address belongs to customer
    const address = await this.prisma.userAddress.findFirst({
      where: { id: input.addressId, userId: customerId },
    });
    if (!address) {
      throw new BookingNotFoundException();
    }

    // Check professional's service area covers the address
    const inServiceArea = professional.serviceAreas.some(
      (area) => area.locality === address.locality && area.pincode === address.pincode,
    );
    if (!inServiceArea) {
      throw new ProfessionalNotAvailableException();
    }

    // Check availability for the requested time slot
    const scheduledStart = new Date(input.scheduledStart);
    const scheduledEnd = new Date(input.scheduledEnd);
    const weekday = scheduledStart.getUTCDay();
    const startMinutes = scheduledStart.getUTCHours() * 60 + scheduledStart.getUTCMinutes();
    const endMinutes = scheduledEnd.getUTCHours() * 60 + scheduledEnd.getUTCMinutes();

    const availableSlot = professional.availability.some(
      (a) => a.weekday === weekday && a.startMinute <= startMinutes && a.endMinute >= endMinutes,
    );
    if (!availableSlot) {
      throw new SlotNotAvailableException();
    }

    // Check for conflicting bookings
    const conflict = await this.prisma.booking.findFirst({
      where: {
        professionalId: input.professionalId,
        status: {
          in: [
            'REQUESTED',
            'ACCEPTED',
            'ARRIVING',
            'ARRIVED',
            'IN_PROGRESS',
            'EXTRA_APPROVAL_PENDING',
          ],
        },
        OR: [{ scheduledStart: { lt: scheduledEnd }, scheduledEnd: { gt: scheduledStart } }],
      },
    });
    if (conflict) {
      throw new SlotNotAvailableException();
    }

    // Get professional's price for this service
    const professionalService = professional.services[0];
    if (!professionalService) {
      throw new ProfessionalNotAvailableException();
    }
    const estimatedAmountMinor = professionalService.basePriceMinor;
    const platformFeeMinor = Math.round(estimatedAmountMinor * 0.15); // 15% platform fee

    // Create booking in transaction
    const booking = await this.prisma.$transaction(async (tx) => {
      const created = await tx.booking.create({
        data: {
          customerId,
          professionalId: input.professionalId,
          serviceId: input.serviceId,
          addressId: input.addressId,
          requestId: requestId ?? null,
          scheduledStart,
          scheduledEnd,
          status: 'REQUESTED',
          estimatedAmountMinor,
          platformFeeMinor,
          notes: input.notes ?? null,
        },
      });

      // Add initial status history
      await tx.bookingStatusHistory.create({
        data: {
          bookingId: created.id,
          status: 'REQUESTED',
          actorType: 'CUSTOMER',
          actorId: customerId,
        },
      });

      return created;
    });

    this.logger.log(`Booking ${booking.id} created by customer ${customerId}`);

    return this.getById(booking.id);
  }

  /**
   * Retrieves a booking by ID for the customer.
   */
  async getById(bookingId: string, customerId?: string): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { include: { category: true } },
        professional: {
          include: {
            professional: { include: { user: { select: { id: true, name: true, phone: true } } } },
          },
        },
        address: true,
        items: true,
        extraWorkReqs: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      throw new BookingNotFoundException();
    }

    if (customerId && booking.customerId !== customerId) {
      throw new BookingNotAuthorizedException();
    }

    return booking as BookingWithRelations;
  }

  /**
   * Retrieves a booking by ID for the professional.
   */
  async getJobById(bookingId: string, professionalId: string): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: { include: { category: true } },
        professional: {
          include: {
            professional: { include: { user: { select: { id: true, name: true, phone: true } } } },
          },
        },
        address: true,
        items: true,
        extraWorkReqs: true,
        statusHistory: { orderBy: { createdAt: 'asc' } },
        payment: true,
        review: true,
      },
    });

    if (!booking) {
      throw new BookingNotFoundException();
    }

    if (booking.professionalId !== professionalId) {
      throw new BookingNotAuthorizedException();
    }

    return booking as BookingWithRelations;
  }

  /**
   * Lists customer's bookings with optional filters.
   */
  async listByCustomer(
    customerId: string,
    status?: string,
    limit = 25,
    offset = 0,
  ): Promise<{ data: BookingWithRelations[]; total: number }> {
    const where: Prisma.BookingWhereInput = { customerId };
    if (status) where.status = status as BookingStatus;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: { include: { category: true } },
          professional: {
            include: {
              professional: {
                include: { user: { select: { id: true, name: true, phone: true } } },
              },
            },
          },
          address: true,
          items: true,
          extraWorkReqs: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: data as BookingWithRelations[], total };
  }

  /**
   * Lists professional's jobs with optional filters.
   */
  async listByProfessional(
    professionalId: string,
    status?: string,
    limit = 25,
    offset = 0,
  ): Promise<{ data: BookingWithRelations[]; total: number }> {
    const where: Prisma.BookingWhereInput = { professionalId };
    if (status) where.status = status as BookingStatus;

    const [data, total] = await Promise.all([
      this.prisma.booking.findMany({
        where,
        include: {
          service: { include: { category: true } },
          professional: {
            include: {
              professional: {
                include: { user: { select: { id: true, name: true, phone: true } } },
              },
            },
          },
          address: true,
          items: true,
          extraWorkReqs: true,
          statusHistory: { orderBy: { createdAt: 'asc' } },
          payment: true,
          review: true,
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.booking.count({ where }),
    ]);

    return { data: data as BookingWithRelations[], total };
  }

  /**
   * Transitions booking status with authorization check.
   */
  async transitionStatus(
    bookingId: string,
    newStatus: BookingStatus,
    actor: { type: 'CUSTOMER' | 'PROFESSIONAL' | 'ADMIN' | 'SYSTEM'; id: string },
    metadata?: Prisma.JsonValue,
  ): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new BookingNotFoundException();
    }

    // Verify authorization
    if (actor.type === 'CUSTOMER' && booking.customerId !== actor.id) {
      throw new BookingNotAuthorizedException();
    }
    if (actor.type === 'PROFESSIONAL' && booking.professionalId !== actor.id) {
      throw new BookingNotAuthorizedException();
    }

    const currentStatus = booking.status;

    if (!canTransition(currentStatus, newStatus, actor.type)) {
      throw new BookingInvalidStatusTransitionException(currentStatus, newStatus, actor.type);
    }

    // Execute transition in transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: newStatus, updatedAt: new Date() },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: newStatus,
          actorType: actor.type,
          actorId: actor.id,
          metadata: metadata ?? undefined,
        },
      });
    });

    this.logger.log(
      `Booking ${bookingId} transitioned: ${currentStatus} → ${newStatus} by ${actor.type}:${actor.id}`,
    );

    return this.getById(bookingId);
  }

  /**
   * Customer cancels a booking.
   */
  async cancelByCustomer(
    bookingId: string,
    customerId: string,
    input: BookingCancelInput,
  ): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BookingNotFoundException();
    if (booking.customerId !== customerId) throw new BookingNotAuthorizedException();

    if (!canTransition(booking.status, 'CANCELLED_BY_CUSTOMER', 'CUSTOMER')) {
      throw new BookingCannotCancelException(booking.status);
    }

    return this.transitionStatus(
      bookingId,
      'CANCELLED_BY_CUSTOMER',
      { type: 'CUSTOMER', id: customerId },
      { reason: input.reason },
    );
  }

  /**
   * Customer approves or rejects extra work.
   */
  async respondToExtraWork(
    bookingId: string,
    customerId: string,
    extraWorkId: string,
    input: ExtraWorkApprovalInput,
  ): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { extraWorkReqs: true },
    });
    if (!booking) throw new BookingNotFoundException();
    if (booking.customerId !== customerId) throw new BookingNotAuthorizedException();

    const ewr = booking.extraWorkReqs.find((e) => e.id === extraWorkId);
    if (!ewr) throw new BookingNotFoundException();
    if (ewr.status !== 'PENDING') throw new ExtraWorkPendingException();

    const newStatus = input.approved ? 'APPROVED' : 'REJECTED';

    await this.prisma.$transaction(async (tx) => {
      await tx.extraWorkRequest.update({
        where: { id: extraWorkId },
        data: { status: newStatus, customerResponseAt: new Date() },
      });

      // If approved, add as booking item and transition to COMPLETED
      if (input.approved) {
        await tx.bookingItem.create({
          data: {
            bookingId,
            description: ewr.description,
            quantity: 1,
            unitPriceMinor: ewr.amountMinor,
            approved: true,
          },
        });

        // Update final amount
        const currentFinal = booking.finalAmountMinor ?? booking.estimatedAmountMinor;
        await tx.booking.update({
          where: { id: bookingId },
          data: { finalAmountMinor: currentFinal + ewr.amountMinor },
        });
      }

      // Transition booking status
      const targetStatus = input.approved ? 'COMPLETED' : 'IN_PROGRESS';
      await tx.booking.update({ where: { id: bookingId }, data: { status: targetStatus } });
      await tx.bookingStatusHistory.create({
        data: { bookingId, status: targetStatus, actorType: 'CUSTOMER', actorId: customerId },
      });
    });

    return this.getById(bookingId, customerId);
  }

  /**
   * Professional accepts a job.
   */
  async acceptJob(
    bookingId: string,
    professionalId: string,
    input: ProfessionalJobAcceptInput,
  ): Promise<BookingWithRelations> {
    return this.transitionStatus(
      bookingId,
      'ACCEPTED',
      { type: 'PROFESSIONAL', id: professionalId },
      { estimatedArrivalMinutes: input.estimatedArrivalMinutes },
    );
  }

  /**
   * Professional declines a job.
   */
  async declineJob(
    bookingId: string,
    professionalId: string,
    input: ProfessionalJobDeclineInput,
  ): Promise<BookingWithRelations> {
    return this.transitionStatus(
      bookingId,
      'CANCELLED_BY_PROFESSIONAL',
      { type: 'PROFESSIONAL', id: professionalId },
      { reason: input.reason },
    );
  }

  /**
   * Professional marks job as arrived.
   */
  async markArrived(bookingId: string, professionalId: string): Promise<BookingWithRelations> {
    return this.transitionStatus(bookingId, 'ARRIVED', {
      type: 'PROFESSIONAL',
      id: professionalId,
    });
  }

  /**
   * Professional starts the job.
   */
  async startJob(bookingId: string, professionalId: string): Promise<BookingWithRelations> {
    return this.transitionStatus(bookingId, 'IN_PROGRESS', {
      type: 'PROFESSIONAL',
      id: professionalId,
    });
  }

  /**
   * Professional proposes extra work.
   */
  async proposeExtraWork(
    bookingId: string,
    professionalId: string,
    input: ProfessionalExtraWorkInput,
  ): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BookingNotFoundException();
    if (booking.professionalId !== professionalId) throw new BookingNotAuthorizedException();

    if (!canTransition(booking.status, 'EXTRA_APPROVAL_PENDING', 'PROFESSIONAL')) {
      throw new BookingInvalidStatusTransitionException(
        booking.status,
        'EXTRA_APPROVAL_PENDING',
        'PROFESSIONAL',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.extraWorkRequest.create({
        data: {
          bookingId,
          professionalId,
          description: input.description,
          amountMinor: input.amountMinor,
          evidenceUrls: input.evidenceUrls,
          status: 'PENDING',
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'EXTRA_APPROVAL_PENDING', updatedAt: new Date() },
      });

      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'EXTRA_APPROVAL_PENDING',
          actorType: 'PROFESSIONAL',
          actorId: professionalId,
        },
      });
    });

    this.logger.log(
      `Extra work proposed for booking ${bookingId} by professional ${professionalId}`,
    );

    return this.getJobById(bookingId, professionalId);
  }

  /**
   * Professional completes the job.
   */
  async completeJob(bookingId: string, professionalId: string): Promise<BookingWithRelations> {
    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) throw new BookingNotFoundException();
    if (booking.professionalId !== professionalId) throw new BookingNotAuthorizedException();

    // Check if there's pending extra work
    const pendingExtra = await this.prisma.extraWorkRequest.findFirst({
      where: { bookingId, status: 'PENDING' },
    });
    if (pendingExtra) {
      throw new ExtraWorkPendingException();
    }

    // Transition to COMPLETED then to PAYMENT_PENDING
    await this.prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED', updatedAt: new Date() },
      });
      await tx.bookingStatusHistory.create({
        data: {
          bookingId,
          status: 'COMPLETED',
          actorType: 'PROFESSIONAL',
          actorId: professionalId,
        },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'PAYMENT_PENDING', updatedAt: new Date() },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId, status: 'PAYMENT_PENDING', actorType: 'SYSTEM', actorId: null },
      });
    });

    this.logger.log(`Job ${bookingId} completed by professional ${professionalId}`);

    return this.getJobById(bookingId, professionalId);
  }

  /**
   * Initiates payment for a completed booking.
   */
  async initiatePayment(
    bookingId: string,
    customerId: string,
  ): Promise<{ providerPaymentId: string; checkoutUrl: string }> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        professional: {
          include: {
            professional: { include: { user: { select: { id: true, name: true, phone: true } } } },
          },
        },
      },
    });
    if (!booking) throw new BookingNotFoundException();
    if (booking.customerId !== customerId) throw new BookingNotAuthorizedException();

    if (!isAwaitingPayment(booking.status)) {
      throw new PaymentRequiredException();
    }

    const idempotencyKey = `payment_${bookingId}_${customerId}`;

    // Calculate final amount
    const itemsTotal = await this.prisma.bookingItem.aggregate({
      where: { bookingId, approved: true },
      _sum: { unitPriceMinor: true },
    });
    const baseAmount = booking.estimatedAmountMinor;
    const extraAmount = itemsTotal._sum.unitPriceMinor ?? 0;
    const finalAmountMinor = baseAmount + extraAmount;
    const platformFeeMinor = Math.round(finalAmountMinor * 0.15);

    // Update booking with final amount
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: { finalAmountMinor, platformFeeMinor },
    });

    if (!booking.professional.professional) {
      throw new ProfessionalNotAvailableException();
    }

    const result = await this.paymentProvider.initiatePayment({
      bookingId,
      amountMinor: finalAmountMinor,
      currency: 'INR',
      customerPhone: booking.professional.professional.user.phone,
      idempotencyKey,
    });

    // Create payment record
    await this.prisma.payment.create({
      data: {
        bookingId,
        provider: 'stub', // TODO: make configurable
        providerPaymentId: result.providerPaymentId,
        amountMinor: finalAmountMinor,
        currency: 'INR',
        status: 'PENDING',
      },
    });

    this.logger.log(`Payment initiated for booking ${bookingId}: ${result.providerPaymentId}`);

    return result;
  }

  /**
   * Verifies payment status (called from webhook or polling).
   */
  async verifyPayment(bookingId: string, providerPaymentId: string): Promise<BookingWithRelations> {
    const payment = await this.prisma.payment.findFirst({
      where: { providerPaymentId },
      include: { booking: true },
    });
    if (!payment) throw new BookingNotFoundException();

    const result = await this.paymentProvider.verifyPayment(providerPaymentId);

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: result.status, paidAt: result.paidAt },
      });

      if (result.status === 'COMPLETED' && result.paidAt) {
        await tx.booking.update({
          where: { id: bookingId },
          data: { status: 'PAID', updatedAt: new Date() },
        });
        await tx.bookingStatusHistory.create({
          data: { bookingId, status: 'PAID', actorType: 'SYSTEM', actorId: null },
        });

        // Generate invoice
        const booking = await tx.booking.findUnique({ where: { id: bookingId } });
        if (booking) {
          await this.generateInvoice(bookingId, payment.amountMinor, booking.platformFeeMinor);
        }
      }
    });

    return this.getById(bookingId);
  }

  /**
   * Generates invoice after payment completion.
   */
  private async generateInvoice(
    bookingId: string,
    finalAmountMinor: number,
    platformFeeMinor: number | null,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { service: true, professional: true, customer: true, address: true },
    });
    if (!booking) return;

    const subtotal = finalAmountMinor;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + (platformFeeMinor ?? 0) + tax;
    const invoiceNumber = `INV-${bookingId.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

    // In production, generate PDF and upload to storage
    // For now, just create the record
    await this.prisma.invoice.create({
      data: {
        bookingId,
        invoiceNumber,
        subtotal,
        fees: platformFeeMinor ?? 0,
        tax,
        total,
        issuedAt: new Date(),
        documentUrl: null, // Would be storage URL
      },
    });

    this.logger.log(`Invoice ${invoiceNumber} generated for booking ${bookingId}`);
  }

  /**
   * Submits a review for a completed booking.
   */
  async submitReview(
    bookingId: string,
    customerId: string,
    input: BookingReviewInput,
  ): Promise<void> {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { review: true },
    });
    if (!booking) throw new BookingNotFoundException();
    if (booking.customerId !== customerId) throw new BookingNotAuthorizedException();
    if (!canBeReviewed(booking.status)) throw new PaymentRequiredException();
    if (booking.review) throw new AlreadyReviewedException();

    await this.prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          bookingId,
          customerId,
          professionalId: booking.professionalId,
          rating: input.rating,
          comment: input.comment,
        },
      });

      if (input.tags?.length) {
        await tx.reviewTag.createMany({
          data: input.tags.map((tag) => ({ reviewId: review.id, tag })),
        });
      }

      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'REVIEWED', updatedAt: new Date() },
      });
      await tx.bookingStatusHistory.create({
        data: { bookingId, status: 'REVIEWED', actorType: 'CUSTOMER', actorId: customerId },
      });

      // Update professional rating
      const avgRating = await tx.review.aggregate({
        where: { professionalId: booking.professionalId },
        _avg: { rating: true },
      });
      await tx.professional.update({
        where: { id: booking.professionalId },
        data: { rating: avgRating._avg.rating, completedJobs: { increment: 1 } },
      });
    });

    this.logger.log(`Review submitted for booking ${bookingId} by customer ${customerId}`);
  }
}
