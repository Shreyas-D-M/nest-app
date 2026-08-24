import type {
  Professional,
  ProfessionalAvailability,
  ProfessionalDocument,
  ProfessionalService,
  ProfessionalServiceArea,
  Service,
} from '@prisma/client';
import type {
  AvailabilityWindow,
  IsoTimestamp,
  MinorUnits,
  ProfessionalDocumentSummary,
  ProfessionalProfile,
  ProfessionalServiceOffering,
  PublicProfessional,
  ServiceArea,
  Uuid,
  Weekday,
} from '@nest/types';

/**
 * Professional mappers.
 *
 * Two output shapes, and the split is a trust boundary rather than a convenience:
 * `PublicProfessional` carries nothing about verification, review notes, or the
 * underlying user, so none of it can reach a customer by accident.
 */

export type ProfessionalWithRelations = Professional & {
  services: (ProfessionalService & { service: Service })[];
  serviceAreas: ProfessionalServiceArea[];
  availability?: ProfessionalAvailability[];
  documents?: ProfessionalDocument[];
};

function toOffering(
  offering: ProfessionalService & { service: Service },
): ProfessionalServiceOffering {
  return {
    serviceId: offering.serviceId as Uuid,
    serviceName: offering.service.name,
    pricingType: offering.pricingType,
    basePriceMinor: offering.basePriceMinor as MinorUnits,
  };
}

function toServiceArea(area: ProfessionalServiceArea): ServiceArea {
  return { locality: area.locality, pincode: area.pincode };
}

export function toAvailabilityWindow(window: ProfessionalAvailability): AvailabilityWindow {
  return {
    weekday: window.weekday as Weekday,
    startMinute: window.startMinute,
    endMinute: window.endMinute,
  };
}

export function toDocumentSummary(document: ProfessionalDocument): ProfessionalDocumentSummary {
  return {
    id: document.id as Uuid,
    documentType: document.documentType,
    verificationStatus: document.verificationStatus,
    expiresAt: (document.expiresAt?.toISOString() ?? null) as IsoTimestamp | null,
    reviewedAt: (document.reviewedAt?.toISOString() ?? null) as IsoTimestamp | null,
    createdAt: document.createdAt.toISOString() as IsoTimestamp,
    // storageUrl is deliberately absent: the key never leaves the server.
  };
}

/**
 * The customer-facing view.
 *
 * Only ever called for an APPROVED professional — the caller is responsible for
 * that filter, and every call site does it in the database query.
 *
 * `rating` is omitted entirely rather than sent as null or zero: reviews do not
 * exist yet, and 09_COMPETITIVE_POSITIONING.md forbids publishing a metric that
 * has not been measured.
 */
export function toPublicProfessional(professional: ProfessionalWithRelations): PublicProfessional {
  return {
    id: professional.id as Uuid,
    businessName: professional.businessName,
    bio: professional.bio,
    yearsExperience: professional.yearsExperience,
    onlineStatus: professional.onlineStatus,
    completedJobs: professional.completedJobs,
    services: professional.services.filter((offering) => offering.active).map(toOffering),
    serviceAreas: professional.serviceAreas.filter((area) => area.active).map(toServiceArea),
  };
}

/** The professional's own view, including verification state and feedback. */
export function toProfessionalProfile(
  professional: ProfessionalWithRelations,
): ProfessionalProfile {
  return {
    id: professional.id as Uuid,
    businessName: professional.businessName,
    bio: professional.bio,
    yearsExperience: professional.yearsExperience,
    verificationStatus: professional.verificationStatus,
    onlineStatus: professional.onlineStatus,
    completedJobs: professional.completedJobs,
    reviewNotes: professional.reviewNotes,
    reviewedAt: (professional.reviewedAt?.toISOString() ?? null) as IsoTimestamp | null,
    services: professional.services.filter((offering) => offering.active).map(toOffering),
    serviceAreas: professional.serviceAreas.filter((area) => area.active).map(toServiceArea),
    availability: (professional.availability ?? [])
      .filter((window) => window.active)
      .map(toAvailabilityWindow),
    documents: (professional.documents ?? []).map(toDocumentSummary),
    createdAt: professional.createdAt.toISOString() as IsoTimestamp,
    updatedAt: professional.updatedAt.toISOString() as IsoTimestamp,
  };
}
