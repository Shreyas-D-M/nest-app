import type { ServiceRequest as PrismaServiceRequest } from '@prisma/client';
import type { ServiceRequestView } from '@nest/types';

/**
 * Service request mappers.
 *
 * Maps Prisma models to the customer-facing API shapes from @nest/types.
 */

type ServiceRequestWithAddress = PrismaServiceRequest & {
  address: {
    id: string;
    label: string;
    locality: string;
    city: string;
  } | null;
  bookings: Array<{ id: string }>;
};

/**
 * Maps a service request to the customer's view.
 *
 * Includes address details if present and the booking ID if matched.
 */
export function toServiceRequestView(request: ServiceRequestWithAddress): ServiceRequestView {
  return {
    id: request.id,
    rawText: request.rawText,
    voiceUrl: request.voiceUrl,
    media: Array.isArray(request.media) ? (request.media as string[]) : null,
    aiCategory: request.aiCategory,
    aiConfidence: request.aiConfidence ? Number(request.aiConfidence) : null,
    status: request.status,
    createdAt: request.createdAt,
    address: request.address
      ? {
          id: request.address.id,
          label: request.address.label,
          locality: request.address.locality,
          city: request.address.city,
        }
      : null,
    bookingId: request.bookings.length > 0 && request.bookings[0] ? request.bookings[0].id : null,
  };
}
