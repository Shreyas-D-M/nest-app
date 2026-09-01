import { Controller, Get, Post, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { FavoritesService } from './favorites.service';
import type { User } from '@prisma/client';

@ApiTags('Favorites')
@ApiBearerAuth()
@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favorites: FavoritesService) {}

  @Post(':professionalId')
  @ApiOperation({ summary: 'Add professional to favorites' })
  async addFavorite(@CurrentUser() user: User, @Param('professionalId') professionalId: string) {
    return this.favorites.addFavorite(user.id, professionalId);
  }

  @Get()
  @ApiOperation({ summary: 'List favorite professionals' })
  async getFavorites(@CurrentUser() user: User) {
    return this.favorites.getFavorites(user.id);
  }

  @Get(':professionalId')
  @ApiOperation({ summary: 'Check if professional is favorited' })
  async isFavorite(@CurrentUser() user: User, @Param('professionalId') professionalId: string) {
    return this.favorites.isFavorite(user.id, professionalId);
  }

  @Delete(':professionalId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove professional from favorites' })
  async removeFavorite(@CurrentUser() user: User, @Param('professionalId') professionalId: string) {
    return this.favorites.removeFavorite(user.id, professionalId);
  }
}
