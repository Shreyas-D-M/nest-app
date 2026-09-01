import { Test, type TestingModule } from '@nestjs/testing';
import type {
  Booking,
  BookingStatus,
  Service,
  Professional,
  User,
  UserAddress,
  PricingType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PAYMENT_PROVIDER } from '../payments/payment-provider';
import { BookingsService } from './bookings.service';
import {
  BookingNotFoundException,
  ProfessionalNotAvailableException,
  SlotNotAvailableException,
  BookingInvalidStatusTransitionException,
  BookingCannotCancelException,
  BookingNotAuthorizedException,
  PaymentRequiredException,
  AlreadyReviewedException,
} from './bookings.exceptions';

describe('BookingsService', () => {
  let service: BookingsService;

  interface MockPrisma {
    booking: {
      findUnique: jest.Mock;
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      count: jest.Mock;
    };
    service: { findUnique: jest.Mock };
    professional: { findUnique: jest.Mock; update: jest.Mock };
    userAddress: { findFirst: jest.Mock };
    extraWorkRequest: {
      findFirst: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    bookingItem: { create: jest.Mock; aggregate: jest.Mock };
    bookingStatusHistory: { create: jest.Mock };
    payment: { create: jest.Mock; findUnique: jest.Mock; findFirst: jest.Mock; update: jest.Mock };
    invoice: { create: jest.Mock };
    review: { create: jest.Mock; aggregate: jest.Mock };
    reviewTag: { createMany: jest.Mock };
    $transaction: jest.Mock;
  }

  const createMockPrisma = (): MockPrisma => {
    const mock = {
      booking: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      service: {
        findUnique: jest.fn(),
      },
      professional: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      userAddress: {
        findFirst: jest.fn(),
      },
      extraWorkRequest: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      bookingItem: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      bookingStatusHistory: {
        create: jest.fn(),
      },
      payment: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      invoice: {
        create: jest.fn(),
      },
      review: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      reviewTag: {
        createMany: jest.fn(),
      },
      $transaction: jest.fn(),
    };
    mock.$transaction.mockImplementation(async (cb: (tx: MockPrisma) => Promise<unknown>) =>
      cb(mock),
    );
    return mock;
  };

  const mockPaymentProvider = {
    initiatePayment: jest.fn(),
    verifyPayment: jest.fn(),
    refundPayment: jest.fn(),
  };

  let mockPrisma: MockPrisma;

  beforeEach(async () => {
    mockPrisma = createMockPrisma();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: PAYMENT_PROVIDER, useValue: mockPaymentProvider },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);

    jest.clearAllMocks();
  });

  const mockService = {
    id: 'service-1',
    categoryId: 'cat-1',
    name: 'AC Repair',
    slug: 'ac-repair',
    description: 'AC repair service',
    pricingType: 'FIXED' as PricingType,
    basePriceMinor: 50000,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    category: {
      id: 'cat-1',
      name: 'AC Services',
      slug: 'ac-services',
      icon: 'ac',
      sortOrder: 1,
      active: true,
    },
  } as Service & { category: { name: string } };

  const mockProfessional = {
    id: 'prof-1',
    userId: 'user-prof-1',
    businessName: 'Cool AC Services',
    bio: 'Expert AC repair',
    yearsExperience: 5,
    verificationStatus: 'APPROVED' as const,
    onlineStatus: 'ONLINE' as const,
    rating: 4.5,
    completedJobs: 100,
    reviewNotes: null,
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: { id: 'user-prof-1', phone: '+919876543210', name: 'John Doe' },
    services: [
      {
        id: 'ps-1',
        professionalId: 'prof-1',
        serviceId: 'service-1',
        basePrice: 50000,
        pricingType: 'FIXED',
        active: true,
      },
    ],
    serviceAreas: [
      {
        id: 'sa-1',
        professionalId: 'prof-1',
        locality: 'Koramangala',
        pincode: '560034',
        active: true,
      },
    ],
    availability: [
      {
        id: 'av-1',
        professionalId: 'prof-1',
        weekday: 3,
        startMinute: 540,
        endMinute: 1080,
        active: true,
      },
    ],
  } as unknown as Professional & {
    user: Pick<User, 'id' | 'name' | 'phone'>;
    services: Array<{
      id: string;
      professionalId: string;
      serviceId: string;
      basePrice: number;
      pricingType: PricingType;
      active: boolean;
    }>;
    serviceAreas: Array<{
      id: string;
      professionalId: string;
      locality: string;
      pincode: string;
      active: boolean;
    }>;
    availability: Array<{
      id: string;
      professionalId: string;
      weekday: number;
      startMinute: number;
      endMinute: number;
      active: boolean;
    }>;
  };

  const mockAddress = {
    id: 'addr-1',
    userId: 'customer-1',
    label: 'Home',
    addressLine: '123 Main St',
    locality: 'Koramangala',
    city: 'Bangalore',
    state: 'Karnataka',
    pincode: '560034',
    latitude: 12.9352,
    longitude: 77.6145,
    instructions: 'Near metro station',
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
  };

  const createMockBooking = (overrides: Partial<Booking> = {}): BookingWithRelations => ({
    id: 'booking-1',
    customerId: 'customer-1',
    professionalId: 'prof-1',
    serviceId: 'service-1',
    addressId: 'addr-1',
    requestId: null,
    scheduledStart: new Date('2026-08-26T10:00:00Z'),
    scheduledEnd: new Date('2026-08-26T12:00:00Z'),
    status: 'REQUESTED' as BookingStatus,
    estimatedAmountMinor: 50000,
    finalAmountMinor: null,
    platformFeeMinor: 7500,
    notes: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    service: mockService,
    professional: mockProfessional,
    address: mockAddress,
    items: [],
    extraWorkRequests: [],
    statusHistory: [],
    payment: null,
    review: null,
    ...overrides,
  });

  type BookingWithRelations = Booking & {
    service: Service & { category: { name: string } };
    professional: Professional & { user: Pick<User, 'id' | 'name' | 'phone'> };
    address: UserAddress;
    items: Array<{
      id: string;
      bookingId: string;
      description: string;
      quantity: number;
      unitPriceMinor: number;
      approved: boolean;
      createdAt: Date;
    }>;
    extraWorkRequests: Array<{
      id: string;
      bookingId: string;
      professionalId: string;
      description: string;
      amountMinor: number;
      evidenceUrls: string[];
      status: string;
      customerResponseAt: Date | null;
      createdAt: Date;
    }>;
    statusHistory: Array<{
      id: string;
      bookingId: string;
      status: BookingStatus;
      actorType: string;
      actorId: string | null;
      metadata: unknown;
      createdAt: Date;
    }>;
    payment: { id: string; status: string } | null;
    review: { id: string } | null;
  };

  const fullBookingInclude = {
    service: mockService,
    professional: {
      id: 'user-prof-1',
      email: null,
      name: 'John Doe',
      phone: '+919876543210',
      avatarUrl: null,
      role: 'PROFESSIONAL' as const,
      status: 'ACTIVE' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      professional: mockProfessional,
    },
    address: mockAddress,
    items: [],
    extraWorkReqs: [
      {
        id: 'ewr-1',
        bookingId: 'booking-1',
        professionalId: 'prof-1',
        description: 'Replace capacitor',
        amountMinor: 10000,
        evidenceUrls: ['url1'],
        status: 'PENDING',
        customerResponseAt: null,
        createdAt: new Date(),
      },
    ],
    statusHistory: [],
    payment: null,
    review: null,
  };

  describe('create', () => {
    it('should create a booking successfully', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.userAddress.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue(createMockBooking());
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...createMockBooking(),
        ...fullBookingInclude,
      });

      const input = {
        serviceId: 'service-1',
        professionalId: 'prof-1',
        addressId: 'addr-1',
        scheduledStart: '2026-08-26T10:00:00Z',
        scheduledEnd: '2026-08-26T12:00:00Z',
      };

      const result = await service.create('customer-1', input);

      expect(result.id).toBe('booking-1');
      expect(result.customerId).toBe('customer-1');
      expect(result.status).toBe('REQUESTED');
      expect(mockPrisma.booking.create).toHaveBeenCalled();
    });

    it('should throw when service not found', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(null);

      await expect(
        service.create('customer-1', {
          serviceId: 'service-1',
          professionalId: 'prof-1',
          addressId: 'addr-1',
          scheduledStart: '2026-08-26T10:00:00Z',
          scheduledEnd: '2026-08-26T12:00:00Z',
        }),
      ).rejects.toThrow(BookingNotFoundException);
    });

    it('should throw when professional not verified', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.professional.findUnique.mockResolvedValue({
        ...mockProfessional,
        verificationStatus: 'PENDING',
      });

      await expect(
        service.create('customer-1', {
          serviceId: 'service-1',
          professionalId: 'prof-1',
          addressId: 'addr-1',
          scheduledStart: '2026-08-26T10:00:00Z',
          scheduledEnd: '2026-08-26T12:00:00Z',
        }),
      ).rejects.toThrow(ProfessionalNotAvailableException);
    });

    it('should throw when address not found', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.userAddress.findFirst.mockResolvedValue(null);

      await expect(
        service.create('customer-1', {
          serviceId: 'service-1',
          professionalId: 'prof-1',
          addressId: 'addr-1',
          scheduledStart: '2026-08-26T10:00:00Z',
          scheduledEnd: '2026-08-26T12:00:00Z',
        }),
      ).rejects.toThrow(BookingNotFoundException);
    });

    it('should throw when slot not available', async () => {
      mockPrisma.service.findUnique.mockResolvedValue(mockService);
      mockPrisma.professional.findUnique.mockResolvedValue(mockProfessional);
      mockPrisma.userAddress.findFirst.mockResolvedValue(mockAddress);
      mockPrisma.booking.findFirst.mockResolvedValue({ id: 'existing-booking' });

      await expect(
        service.create('customer-1', {
          serviceId: 'service-1',
          professionalId: 'prof-1',
          addressId: 'addr-1',
          scheduledStart: '2026-08-26T10:00:00Z',
          scheduledEnd: '2026-08-26T12:00:00Z',
        }),
      ).rejects.toThrow(SlotNotAvailableException);
    });
  });

  describe('transitionStatus', () => {
    it('should allow valid customer transition', async () => {
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(createMockBooking({ status: 'REQUESTED' }))
        .mockResolvedValueOnce({
          ...createMockBooking({ status: 'CANCELLED_BY_CUSTOMER' }),
          ...fullBookingInclude,
        });
      mockPrisma.booking.update.mockResolvedValue(
        createMockBooking({ status: 'CANCELLED_BY_CUSTOMER' }),
      );

      const result = await service.transitionStatus('booking-1', 'CANCELLED_BY_CUSTOMER', {
        type: 'CUSTOMER',
        id: 'customer-1',
      });

      expect(result.status).toBe('CANCELLED_BY_CUSTOMER');
    });

    it('should reject invalid transition', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(createMockBooking({ status: 'ACCEPTED' }));

      await expect(
        service.transitionStatus('booking-1', 'CANCELLED_BY_CUSTOMER', {
          type: 'CUSTOMER',
          id: 'customer-1',
        }),
      ).rejects.toThrow(BookingInvalidStatusTransitionException);
    });

    it('should reject unauthorized customer', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(
        createMockBooking({ customerId: 'other-customer' }),
      );

      await expect(
        service.transitionStatus('booking-1', 'CANCELLED_BY_CUSTOMER', {
          type: 'CUSTOMER',
          id: 'customer-1',
        }),
      ).rejects.toThrow(BookingNotAuthorizedException);
    });
  });

  describe('cancelByCustomer', () => {
    it('should cancel booking from REQUESTED status', async () => {
      const requestedBooking = createMockBooking({ status: 'REQUESTED' });
      const cancelledBooking = createMockBooking({ status: 'CANCELLED_BY_CUSTOMER' });
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(requestedBooking) // cancelByCustomer finds it
        .mockResolvedValueOnce(requestedBooking) // transitionStatus finds it
        .mockResolvedValueOnce({ ...cancelledBooking, ...fullBookingInclude }); // getById after transition
      mockPrisma.booking.update.mockResolvedValue(cancelledBooking);

      const result = await service.cancelByCustomer('booking-1', 'customer-1', {
        reason: 'Changed my mind',
      });

      expect(result.status).toBe('CANCELLED_BY_CUSTOMER');
    });

    it('should throw when cannot cancel from current status', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(createMockBooking({ status: 'COMPLETED' }));

      await expect(
        service.cancelByCustomer('booking-1', 'customer-1', { reason: 'Too late' }),
      ).rejects.toThrow(BookingCannotCancelException);
    });
  });

  describe('acceptJob', () => {
    it('should accept a job', async () => {
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(createMockBooking({ status: 'REQUESTED' }))
        .mockResolvedValueOnce({
          ...createMockBooking({ status: 'ACCEPTED' }),
          ...fullBookingInclude,
        });
      mockPrisma.booking.update.mockResolvedValue(createMockBooking({ status: 'ACCEPTED' }));

      const result = await service.acceptJob('booking-1', 'prof-1', {
        estimatedArrivalMinutes: 30,
      });

      expect(result.status).toBe('ACCEPTED');
    });
  });

  describe('proposeExtraWork', () => {
    it('should propose extra work during IN_PROGRESS', async () => {
      const inProgressBooking = createMockBooking({ status: 'IN_PROGRESS' });
      const updatedBooking = {
        ...inProgressBooking,
        status: 'EXTRA_APPROVAL_PENDING' as BookingStatus,
        ...fullBookingInclude,
      };
      // First call: findUnique in proposeExtraWork, second call: getJobById
      mockPrisma.booking.findUnique
        .mockResolvedValueOnce(inProgressBooking)
        .mockResolvedValueOnce(updatedBooking);
      mockPrisma.booking.update.mockResolvedValue({
        ...inProgressBooking,
        status: 'EXTRA_APPROVAL_PENDING',
      });
      mockPrisma.extraWorkRequest.create.mockResolvedValue({});

      const result = await service.proposeExtraWork('booking-1', 'prof-1', {
        description: 'Replace capacitor',
        amountMinor: 10000,
        evidenceUrls: ['url1'],
      });

      expect(result.status).toBe('EXTRA_APPROVAL_PENDING');
      expect(result.extraWorkReqs?.[0]?.status).toBe('PENDING');
    });

    it('should throw when not in IN_PROGRESS', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(createMockBooking({ status: 'ACCEPTED' }));

      await expect(
        service.proposeExtraWork('booking-1', 'prof-1', {
          description: 'Extra work',
          amountMinor: 10000,
          evidenceUrls: ['url1'],
        }),
      ).rejects.toThrow(BookingInvalidStatusTransitionException);
    });
  });

  describe('initiatePayment', () => {
    it('should initiate payment for COMPLETED booking', async () => {
      const completedBooking = createMockBooking({ status: 'PAYMENT_PENDING' });
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...completedBooking,
        professional: {
          id: 'user-prof-1',
          email: null,
          name: 'John Doe',
          phone: '+919876543210',
          avatarUrl: null,
          role: 'PROFESSIONAL' as const,
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: mockProfessional,
        },
      });
      mockPrisma.bookingItem.aggregate.mockResolvedValue({ _sum: { unitPriceMinor: 0 } });
      mockPrisma.booking.update.mockResolvedValue({
        ...completedBooking,
        finalAmountMinor: 50000,
        platformFeeMinor: 7500,
      });
      mockPaymentProvider.initiatePayment.mockResolvedValue({
        providerPaymentId: 'pay_123',
        checkoutUrl: 'https://checkout.example.com/pay_123',
      });
      mockPrisma.payment.create.mockResolvedValue({});

      const result = await service.initiatePayment('booking-1', 'customer-1');

      expect(result.providerPaymentId).toBe('pay_123');
      expect(result.checkoutUrl).toContain('checkout.example.com');
    });

    it('should throw when not awaiting payment', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(createMockBooking({ status: 'IN_PROGRESS' }));

      await expect(service.initiatePayment('booking-1', 'customer-1')).rejects.toThrow(
        PaymentRequiredException,
      );
    });
  });

  describe('verifyPayment', () => {
    it('should verify payment and update booking to PAID', async () => {
      const payment = {
        id: 'payment-1',
        bookingId: 'booking-1',
        providerPaymentId: 'pay_123',
        amountMinor: 50000,
        currency: 'INR',
        status: 'PENDING',
        paidAt: null,
        booking: createMockBooking(),
      };

      mockPrisma.payment.findFirst.mockResolvedValue(payment);
      mockPaymentProvider.verifyPayment.mockResolvedValue({
        status: 'COMPLETED',
        paidAt: new Date(),
      });
      mockPrisma.payment.update.mockResolvedValue({ ...payment, status: 'COMPLETED' });
      mockPrisma.booking.update.mockResolvedValue({ ...createMockBooking(), status: 'PAID' });
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...createMockBooking({ status: 'PAID' }),
        ...fullBookingInclude,
        professional: {
          id: 'user-prof-1',
          email: null,
          name: 'John Doe',
          phone: '+919876543210',
          avatarUrl: null,
          role: 'PROFESSIONAL' as const,
          status: 'ACTIVE' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
          professional: mockProfessional,
        },
        payment: { id: 'payment-1', status: 'COMPLETED' },
      });
      mockPrisma.invoice.create.mockResolvedValue({});

      const result = await service.verifyPayment('booking-1', 'pay_123');

      expect(result.status).toBe('PAID');
    });
  });

  describe('submitReview', () => {
    it('should submit review for PAID booking', async () => {
      const paidBooking = createMockBooking({ status: 'PAID' });
      mockPrisma.booking.findUnique.mockResolvedValue({ ...paidBooking, review: null });
      mockPrisma.review.create.mockResolvedValue({ id: 'review-1' });
      mockPrisma.booking.update.mockResolvedValue({
        ...paidBooking,
        status: 'REVIEWED',
        updatedAt: new Date(),
      });
      mockPrisma.review.aggregate.mockResolvedValue({ _avg: { rating: 4.5 } });
      mockPrisma.professional.update.mockResolvedValue({});

      await service.submitReview('booking-1', 'customer-1', {
        rating: 5,
        comment: 'Great job!',
        tags: ['punctual', 'quality'],
      });

      expect(mockPrisma.review.create).toHaveBeenCalled();
      expect(mockPrisma.booking.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'booking-1' },
          data: expect.objectContaining({ status: 'REVIEWED' }),
        }),
      );
    });

    it('should throw when already reviewed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        ...createMockBooking({ status: 'PAID' }),
        review: { id: 'review-1' },
      });

      await expect(
        service.submitReview('booking-1', 'customer-1', { rating: 5, comment: 'Great job!' }),
      ).rejects.toThrow(AlreadyReviewedException);
    });
  });
});
