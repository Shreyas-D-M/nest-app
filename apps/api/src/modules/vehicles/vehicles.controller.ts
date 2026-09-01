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
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto, UpdateVehicleDto } from './vehicles.dto';
import type { User } from '@prisma/client';

@ApiTags('Vehicles')
@ApiBearerAuth()
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a vehicle' })
  async createVehicle(@CurrentUser() user: User, @Body() dto: CreateVehicleDto) {
    return this.vehicles.createVehicle(user.id, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vehicles' })
  async getVehicles(@CurrentUser() user: User) {
    return this.vehicles.getVehicles(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get vehicle details' })
  async getVehicle(@CurrentUser() user: User, @Param('id') id: string) {
    return this.vehicles.getVehicle(user.id, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update vehicle' })
  async updateVehicle(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.updateVehicle(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete vehicle' })
  async deleteVehicle(@CurrentUser() user: User, @Param('id') id: string) {
    return this.vehicles.deleteVehicle(user.id, id);
  }
}
