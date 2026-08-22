import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import type { User } from '@prisma/client';
import type { Address } from '@nest/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CreateAddressDto, UpdateAddressDto } from './addresses.dto';
import { toAddress } from './addresses.mapper';
import { AddressesService } from './addresses.service';

/**
 * `/me/addresses` endpoints from 06_API_SPEC.md.
 *
 * The caller's id comes from the access token, never from the request, so one user
 * cannot read or modify another's addresses by changing a parameter.
 *
 * `ParseUUIDPipe` rejects a malformed id with 400 before it reaches a query,
 * keeping obviously invalid input away from the database.
 */
@Controller('me/addresses')
export class AddressesController {
  constructor(private readonly addresses: AddressesService) {}

  @Get()
  async list(@CurrentUser() user: User): Promise<Address[]> {
    const addresses = await this.addresses.listForUser(user.id);

    return addresses.map(toAddress);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@CurrentUser() user: User, @Body() dto: CreateAddressDto): Promise<Address> {
    return toAddress(await this.addresses.create(user.id, dto));
  }

  @Patch(':id')
  async update(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<Address> {
    return toAddress(await this.addresses.update(user.id, id, dto));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@CurrentUser() user: User, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.addresses.softDelete(user.id, id);
  }
}
