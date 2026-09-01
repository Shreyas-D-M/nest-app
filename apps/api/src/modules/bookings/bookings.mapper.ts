import type {
  Booking,
  User,
  Service,
  Professional,
  UserAddress,
  BookingItem,
  ExtraWorkRequest,
  BookingStatusHistory,
} from '@prisma/client';
import type { Decimal } from '@prisma/client/runtime/client';
import type { CustomerBookingView, ProfessionalJobView, BookingStatus } from '@nest/types';
import {
  canTransition,
  isAwaitingPayment,
  canBeReviewed,
  canProposeExtraWork,
} from '../../domain/booking/booking-transitions';

type BookingWithRelations = Booking & {
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
};

const professionalData = (booking: BookingWithRelations) => booking.professional.professional!;

/**
 * Maps a booking to the customer's view.
 */
export function toCustomerBookingView(booking: BookingWithRelations): CustomerBookingView {
  const canCancel = canTransition(
    booking.status as BookingStatus,
    'CANCELLED_BY_CUSTOMER',
    'CUSTOMER',
  );
  const canReview = canBeReviewed(booking.status as BookingStatus);
  const canPayment = isAwaitingPayment(booking.status as BookingStatus);

  return {
    id: booking.id,
    status: booking.status as BookingStatus,
    scheduledStart: booking.scheduledStart,
    scheduledEnd: booking.scheduledEnd,
    estimatedAmountMinor: booking.estimatedAmountMinor,
    finalAmountMinor: booking.finalAmountMinor,
    notes: booking.notes,
    createdAt: booking.createdAt,
    service: {
      id: booking.service.id,
      name: booking.service.name,
      categoryName: booking.service.category.name,
    },
    professional: {
      id: booking.professional.id,
      businessName: professionalData(booking).businessName,
      rating: professionalData(booking).rating ? Number(professionalData(booking).rating) : null,
      completedJobs: professionalData(booking).completedJobs,
    },
    address: {
      id: booking.address.id,
      label: booking.address.label,
      addressLine: booking.address.addressLine,
      locality: booking.address.locality,
      city: booking.address.city,
    },
    extraWorkRequests: booking.extraWorkReqs.map((ewr) => ({
      id: ewr.id,
      description: ewr.description,
      amountMinor: ewr.amountMinor,
      evidenceUrls: ewr.evidenceUrls,
      status: ewr.status,
      createdAt: ewr.createdAt,
    })),
    items: booking.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPriceMinor: item.unitPriceMinor,
      approved: item.approved,
    })),
    canCancel,
    canReview,
    canPayment,
  };
}

/**
 * Maps a booking to the professional's job view.
 */
export function toProfessionalJobView(booking: BookingWithRelations): ProfessionalJobView {
  const prof = booking.professional.professional!;

  const canAccept = canTransition(booking.status as BookingStatus, 'ACCEPTED', 'PROFESSIONAL');
  const canDecline = canTransition(
    booking.status as BookingStatus,
    'CANCELLED_BY_PROFESSIONAL',
    'PROFESSIONAL',
  );
  const canMarkArrived = canTransition(booking.status as BookingStatus, 'ARRIVED', 'PROFESSIONAL');
  const canStart = canTransition(booking.status as BookingStatus, 'IN_PROGRESS', 'PROFESSIONAL');
  const canProposeExtra = canProposeExtraWork(booking.status as BookingStatus);
  const canComplete = canTransition(booking.status as BookingStatus, 'COMPLETED', 'PROFESSIONAL');

  return {
    id: booking.id,
    status: booking.status as BookingStatus,
    scheduledStart: booking.scheduledStart,
    scheduledEnd: booking.scheduledEnd,
    estimatedAmountMinor: booking.estimatedAmountMinor,
    finalAmountMinor: booking.finalAmountMinor,
    notes: booking.notes,
    createdAt: booking.createdAt,
    service: {
      id: booking.service.id,
      name: booking.service.name,
      categoryName: booking.service.category.name,
    },
    customer: {
      id: prof.user.id,
      name: prof.user.name,
      phone: prof.user.phone,
    },
    address: {
      label: booking.address.label,
      addressLine: booking.address.addressLine,
      locality: booking.address.locality,
      city: booking.address.city,
      instructions: booking.address.instructions,
    },
    items: booking.items.map((item) => ({
      id: item.id,
      description: item.description,
      quantity: Number(item.quantity),
      unitPriceMinor: item.unitPriceMinor,
      approved: item.approved,
    })),
    canAccept,
    canDecline,
    canMarkArrived,
    canStart,
    canProposeExtraWork: canProposeExtra,
    canComplete,
  };
}

/**
 * Maps a booking to a minimal summary for list views.
 */
export function toBookingSummary(
  booking: Booking & {
    service: Service & { category: { name: string } };
    professional: User & {
      professional: (Professional & { user: Pick<User, 'id' | 'name' | 'phone'> }) | null;
    };
  },
): Pick<
  CustomerBookingView,
  | 'id'
  | 'status'
  | 'scheduledStart'
  | 'scheduledEnd'
  | 'estimatedAmountMinor'
  | 'service'
  | 'professional'
  | 'createdAt'
> {
  const prof = booking.professional.professional!;
  return {
    id: booking.id,
    status: booking.status as BookingStatus,
    scheduledStart: booking.scheduledStart,
    scheduledEnd: booking.scheduledEnd,
    estimatedAmountMinor: booking.estimatedAmountMinor,
    service: {
      id: booking.service.id,
      name: booking.service.name,
      categoryName: booking.service.category.name,
    },
    professional: {
      id: booking.professional.id,
      businessName: prof.businessName,
      rating: prof.rating ? Number(prof.rating) : null,
      completedJobs: prof.completedJobs,
    },
    createdAt: booking.createdAt,
  };
}
