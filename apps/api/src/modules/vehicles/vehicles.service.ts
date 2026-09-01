import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class VehiclesService {
  constructor(private readonly prisma: PrismaService) {}

  async createVehicle(
    customerId: string,
    input: {
      make: string;
      model: string;
      variant?: string;
      registrationMasked: string;
      purchaseDate?: string;
      notes?: string;
    },
  ) {
    return this.prisma.vehicle.create({
      data: {
        customerId,
        make: input.make,
        model: input.model,
        variant: input.variant,
        registrationMasked: input.registrationMasked,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        notes: input.notes,
      },
    });
  }

  async getVehicles(customerId: string) {
    return this.prisma.vehicle.findMany({
      where: { customerId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getVehicle(customerId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: vehicleId, customerId },
    });
    if (!vehicle) throw new NotFoundException('Vehicle not found');
    return vehicle;
  }

  async updateVehicle(
    customerId: string,
    vehicleId: string,
    input: {
      make?: string;
      model?: string;
      variant?: string;
      registrationMasked?: string;
      purchaseDate?: string;
      notes?: string;
    },
  ) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, customerId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    return this.prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        make: input.make,
        model: input.model,
        variant: input.variant,
        registrationMasked: input.registrationMasked,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        notes: input.notes,
      },
    });
  }

  async deleteVehicle(customerId: string, vehicleId: string) {
    const vehicle = await this.prisma.vehicle.findFirst({ where: { id: vehicleId, customerId } });
    if (!vehicle) throw new NotFoundException('Vehicle not found');

    await this.prisma.vehicle.delete({ where: { id: vehicleId } });
    return { success: true };
  }
}
