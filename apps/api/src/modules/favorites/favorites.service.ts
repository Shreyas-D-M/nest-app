import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async addFavorite(customerId: string, professionalId: string) {
    // Verify professional exists
    const professional = await this.prisma.professional.findUnique({
      where: { id: professionalId },
      include: { user: { select: { name: true, avatarUrl: true } } },
    });
    if (!professional) throw new NotFoundException('Professional not found');

    // Check if already favorited
    const existing = await this.prisma.favorite.findUnique({
      where: { customerId_professionalId: { customerId, professionalId } },
    });
    if (existing) throw new ConflictException('Already in favorites');

    return this.prisma.favorite.create({
      data: { customerId, professionalId },
      include: {
        professional: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
    });
  }

  async getFavorites(customerId: string) {
    return this.prisma.favorite.findMany({
      where: { customerId },
      include: {
        professional: {
          include: {
            user: { select: { name: true, avatarUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async removeFavorite(customerId: string, professionalId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { customerId_professionalId: { customerId, professionalId } },
    });
    if (!favorite) throw new NotFoundException('Favorite not found');

    await this.prisma.favorite.delete({
      where: { customerId_professionalId: { customerId, professionalId } },
    });
    return { success: true };
  }

  async isFavorite(customerId: string, professionalId: string) {
    const favorite = await this.prisma.favorite.findUnique({
      where: { customerId_professionalId: { customerId, professionalId } },
    });
    return { isFavorite: !!favorite };
  }
}
