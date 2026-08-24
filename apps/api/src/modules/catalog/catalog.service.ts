import { Injectable } from '@nestjs/common';
import type { Category, Service } from '@prisma/client';
import { ResourceNotFoundException } from '../../common/errors/api-exception';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Service catalogue reads.
 *
 * Only active categories and active services are ever returned to a customer.
 * Deactivating a service is how it is withdrawn: the row is retained because
 * existing bookings will reference it.
 */
@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The full catalogue, grouped by category.
   *
   * Categories with no active services are omitted — an empty category is a dead
   * end for a customer.
   */
  async getCatalog(): Promise<(Category & { services: Service[] })[]> {
    const categories = await this.prisma.category.findMany({
      where: { active: true },
      orderBy: { sortOrder: 'asc' },
      include: {
        services: {
          where: { active: true },
          orderBy: { name: 'asc' },
        },
      },
    });

    return categories.filter((category) => category.services.length > 0);
  }

  /**
   * One active service.
   *
   * @throws ResourceNotFoundException when the service does not exist or is
   * inactive. An inactive service is indistinguishable from a missing one to a
   * customer, which is the intended behaviour.
   */
  async getActiveServiceById(id: string): Promise<Service & { category: Category }> {
    const service = await this.prisma.service.findFirst({
      where: { id, active: true, category: { active: true } },
      include: { category: true },
    });

    if (service === null) {
      throw new ResourceNotFoundException('Service not found.');
    }

    return service;
  }
}
