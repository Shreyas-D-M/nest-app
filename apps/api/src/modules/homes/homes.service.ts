import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AssetType } from '@prisma/client';

@Injectable()
export class HomesService {
  constructor(private readonly prisma: PrismaService) {}

  // Homes
  async createHome(customerId: string, input: { name: string; addressId: string }) {
    const address = await this.prisma.userAddress.findFirst({
      where: { id: input.addressId, userId: customerId, deletedAt: null },
    });
    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return this.prisma.home.create({
      data: {
        customerId,
        name: input.name,
        addressId: input.addressId,
      },
      include: { address: true },
    });
  }

  async getHomes(customerId: string) {
    return this.prisma.home.findMany({
      where: { customerId },
      include: { address: true, assets: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getHome(customerId: string, homeId: string) {
    const home = await this.prisma.home.findFirst({
      where: { id: homeId, customerId },
      include: {
        address: true,
        assets: { include: { maintenanceRecords: { orderBy: { serviceDate: 'desc' } } } },
      },
    });
    if (!home) throw new NotFoundException('Home not found');
    return home;
  }

  async updateHome(
    customerId: string,
    homeId: string,
    input: { name?: string; addressId?: string },
  ) {
    const home = await this.prisma.home.findFirst({ where: { id: homeId, customerId } });
    if (!home) throw new NotFoundException('Home not found');

    if (input.addressId) {
      const address = await this.prisma.userAddress.findFirst({
        where: { id: input.addressId, userId: customerId, deletedAt: null },
      });
      if (!address) throw new NotFoundException('Address not found');
    }

    return this.prisma.home.update({
      where: { id: homeId },
      data: input,
      include: { address: true },
    });
  }

  async deleteHome(customerId: string, homeId: string) {
    const home = await this.prisma.home.findFirst({ where: { id: homeId, customerId } });
    if (!home) throw new NotFoundException('Home not found');

    await this.prisma.home.delete({ where: { id: homeId } });
    return { success: true };
  }

  // Assets
  async createAsset(
    customerId: string,
    homeId: string,
    input: {
      assetType: AssetType;
      brand?: string;
      model?: string;
      serialNumber?: string;
      purchaseDate?: string;
      warrantyEnd?: string;
      notes?: string;
      imageUrl?: string;
    },
  ) {
    const home = await this.prisma.home.findFirst({ where: { id: homeId, customerId } });
    if (!home) throw new NotFoundException('Home not found');

    return this.prisma.asset.create({
      data: {
        homeId,
        assetType: input.assetType,
        brand: input.brand,
        model: input.model,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        warrantyEnd: input.warrantyEnd ? new Date(input.warrantyEnd) : null,
        notes: input.notes,
        imageUrl: input.imageUrl,
      },
    });
  }

  async getAssets(customerId: string, homeId: string) {
    const home = await this.prisma.home.findFirst({ where: { id: homeId, customerId } });
    if (!home) throw new NotFoundException('Home not found');

    return this.prisma.asset.findMany({
      where: { homeId },
      include: { maintenanceRecords: { orderBy: { serviceDate: 'desc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAsset(customerId: string, homeId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, home: { id: homeId, customerId } },
      include: { maintenanceRecords: { orderBy: { serviceDate: 'desc' } } },
    });
    if (!asset) throw new NotFoundException('Asset not found');
    return asset;
  }

  async updateAsset(
    customerId: string,
    homeId: string,
    assetId: string,
    input: {
      assetType?: AssetType;
      brand?: string;
      model?: string;
      serialNumber?: string;
      purchaseDate?: string;
      warrantyEnd?: string;
      notes?: string;
      imageUrl?: string;
    },
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, home: { id: homeId, customerId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.asset.update({
      where: { id: assetId },
      data: {
        assetType: input.assetType,
        brand: input.brand,
        model: input.model,
        serialNumber: input.serialNumber,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        warrantyEnd: input.warrantyEnd ? new Date(input.warrantyEnd) : undefined,
        notes: input.notes,
        imageUrl: input.imageUrl,
      },
    });
  }

  async deleteAsset(customerId: string, homeId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, home: { id: homeId, customerId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    await this.prisma.asset.delete({ where: { id: assetId } });
    return { success: true };
  }

  // Maintenance Records
  async createMaintenanceRecord(
    customerId: string,
    homeId: string,
    assetId: string,
    input: {
      bookingId?: string;
      serviceDate: string;
      summary: string;
      nextDueDate?: string;
      cost?: number;
    },
  ) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, home: { id: homeId, customerId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    if (input.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: input.bookingId, customerId },
      });
      if (!booking) throw new NotFoundException('Booking not found');
    }

    return this.prisma.maintenanceRecord.create({
      data: {
        assetId,
        bookingId: input.bookingId,
        serviceDate: new Date(input.serviceDate),
        summary: input.summary,
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : null,
        cost: input.cost,
      },
    });
  }

  async getMaintenanceRecords(customerId: string, homeId: string, assetId: string) {
    const asset = await this.prisma.asset.findFirst({
      where: { id: assetId, home: { id: homeId, customerId } },
    });
    if (!asset) throw new NotFoundException('Asset not found');

    return this.prisma.maintenanceRecord.findMany({
      where: { assetId },
      orderBy: { serviceDate: 'desc' },
    });
  }

  async updateMaintenanceRecord(
    customerId: string,
    homeId: string,
    assetId: string,
    recordId: string,
    input: {
      bookingId?: string;
      serviceDate?: string;
      summary?: string;
      nextDueDate?: string;
      cost?: number;
    },
  ) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: {
        id: recordId,
        asset: { id: assetId, home: { id: homeId, customerId } },
      },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');

    if (input.bookingId) {
      const booking = await this.prisma.booking.findFirst({
        where: { id: input.bookingId, customerId },
      });
      if (!booking) throw new NotFoundException('Booking not found');
    }

    return this.prisma.maintenanceRecord.update({
      where: { id: recordId },
      data: {
        bookingId: input.bookingId,
        serviceDate: input.serviceDate ? new Date(input.serviceDate) : undefined,
        summary: input.summary,
        nextDueDate: input.nextDueDate ? new Date(input.nextDueDate) : undefined,
        cost: input.cost,
      },
    });
  }

  async deleteMaintenanceRecord(
    customerId: string,
    homeId: string,
    assetId: string,
    recordId: string,
  ) {
    const record = await this.prisma.maintenanceRecord.findFirst({
      where: {
        id: recordId,
        asset: { id: assetId, home: { id: homeId, customerId } },
      },
    });
    if (!record) throw new NotFoundException('Maintenance record not found');

    await this.prisma.maintenanceRecord.delete({ where: { id: recordId } });
    return { success: true };
  }
}
