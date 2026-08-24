import type { Category, Service } from '@prisma/client';
import type {
  CatalogCategory,
  CatalogResponse,
  CatalogService,
  IsoTimestamp,
  MinorUnits,
  ServiceDetail,
  Uuid,
} from '@nest/types';

/**
 * Catalogue mappers.
 *
 * Field-by-field rather than spread, so a column added later cannot leak into a
 * public response.
 */

export function toCatalogService(service: Service): CatalogService {
  return {
    id: service.id as Uuid,
    name: service.name,
    slug: service.slug,
    description: service.description,
    pricingType: service.pricingType,
    basePriceMinor: service.basePriceMinor as MinorUnits | null,
  };
}

type CategoryWithServices = Category & { services: Service[] };

export function toCatalogResponse(categories: CategoryWithServices[]): CatalogResponse {
  const mapped: CatalogCategory[] = categories.map((category) => ({
    id: category.id as Uuid,
    name: category.name,
    slug: category.slug,
    icon: category.icon,
    services: category.services.map(toCatalogService),
  }));

  return { categories: mapped };
}

export function toServiceDetail(service: Service & { category: Category }): ServiceDetail {
  return {
    ...toCatalogService(service),
    category: {
      id: service.category.id as Uuid,
      name: service.category.name,
      slug: service.category.slug,
      icon: service.category.icon,
    },
    active: service.active,
    createdAt: service.createdAt.toISOString() as IsoTimestamp,
    updatedAt: service.updatedAt.toISOString() as IsoTimestamp,
  };
}
