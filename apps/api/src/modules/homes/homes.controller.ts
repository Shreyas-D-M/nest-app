import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { HomesService } from './homes.service';
import {
  CreateHomeDto,
  UpdateHomeDto,
  CreateAssetDto,
  UpdateAssetDto,
  CreateMaintenanceRecordDto,
  UpdateMaintenanceRecordDto,
} from './homes.dto';
import type { User } from '@prisma/client';

@ApiTags('Homes')
@ApiBearerAuth()
@Controller('homes')
export class HomesController {
  constructor(private readonly homes: HomesService) {}

  // Homes
  @Post()
  @ApiOperation({ summary: 'Create a home' })
  async createHome(@CurrentUser() user: User, @Body() dto: CreateHomeDto) {
    return this.homes.createHome(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List homes' })
  async getHomes(@CurrentUser() user: User) {
    return this.homes.getHomes(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get home details with assets' })
  async getHome(@CurrentUser() user: User, @Param('id') id: string) {
    return this.homes.getHome(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update home' })
  async updateHome(@CurrentUser() user: User, @Param('id') id: string, @Body() dto: UpdateHomeDto) {
    return this.homes.updateHome(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete home' })
  async deleteHome(@CurrentUser() user: User, @Param('id') id: string) {
    return this.homes.deleteHome(user.id, id);
  }

  // Assets
  @Post(':homeId/assets')
  @ApiOperation({ summary: 'Add asset to home' })
  async createAsset(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Body() dto: CreateAssetDto,
  ) {
    return this.homes.createAsset(user.id, homeId, dto);
  }

  @Get(':homeId/assets')
  @ApiOperation({ summary: 'List assets in home' })
  async getAssets(@CurrentUser() user: User, @Param('homeId') homeId: string) {
    return this.homes.getAssets(user.id, homeId);
  }

  @Get(':homeId/assets/:assetId')
  @ApiOperation({ summary: 'Get asset with maintenance history' })
  async getAsset(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.homes.getAsset(user.id, homeId, assetId);
  }

  @Patch(':homeId/assets/:assetId')
  @ApiOperation({ summary: 'Update asset' })
  async updateAsset(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
    @Body() dto: UpdateAssetDto,
  ) {
    return this.homes.updateAsset(user.id, homeId, assetId, dto);
  }

  @Delete(':homeId/assets/:assetId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete asset' })
  async deleteAsset(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.homes.deleteAsset(user.id, homeId, assetId);
  }

  // Maintenance Records
  @Post(':homeId/assets/:assetId/maintenance')
  @ApiOperation({ summary: 'Add maintenance record' })
  async createMaintenanceRecord(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
    @Body() dto: CreateMaintenanceRecordDto,
  ) {
    return this.homes.createMaintenanceRecord(user.id, homeId, assetId, dto);
  }

  @Get(':homeId/assets/:assetId/maintenance')
  @ApiOperation({ summary: 'List maintenance records' })
  async getMaintenanceRecords(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
  ) {
    return this.homes.getMaintenanceRecords(user.id, homeId, assetId);
  }

  @Patch(':homeId/assets/:assetId/maintenance/:recordId')
  @ApiOperation({ summary: 'Update maintenance record' })
  async updateMaintenanceRecord(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
    @Param('recordId') recordId: string,
    @Body() dto: UpdateMaintenanceRecordDto,
  ) {
    return this.homes.updateMaintenanceRecord(user.id, homeId, assetId, recordId, dto);
  }

  @Delete(':homeId/assets/:assetId/maintenance/:recordId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete maintenance record' })
  async deleteMaintenanceRecord(
    @CurrentUser() user: User,
    @Param('homeId') homeId: string,
    @Param('assetId') assetId: string,
    @Param('recordId') recordId: string,
  ) {
    return this.homes.deleteMaintenanceRecord(user.id, homeId, assetId, recordId);
  }
}
