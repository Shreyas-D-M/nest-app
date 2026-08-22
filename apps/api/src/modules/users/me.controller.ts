import { Body, Controller, Get, Patch } from '@nestjs/common';
import type { User } from '@prisma/client';
import type { CurrentUser as CurrentUserPayload } from '@nest/types';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UpdateProfileDto } from './users.dto';
import { toCurrentUser } from './users.mapper';
import { UsersService } from './users.service';

/**
 * `GET /me` and `PATCH /me` from 06_API_SPEC.md.
 *
 * Both operate strictly on the authenticated caller. There is no user id in the
 * path, so there is no object-level authorization to get wrong.
 */
@Controller('me')
export class MeController {
  constructor(private readonly users: UsersService) {}

  @Get()
  getMe(@CurrentUser() user: User): CurrentUserPayload {
    // The guard already loaded this row; re-reading it would be a wasted query.
    return toCurrentUser(user);
  }

  @Patch()
  async updateMe(
    @CurrentUser() user: User,
    @Body() dto: UpdateProfileDto,
  ): Promise<CurrentUserPayload> {
    const updated = await this.users.updateProfile(user.id, dto);

    return toCurrentUser(updated);
  }
}
