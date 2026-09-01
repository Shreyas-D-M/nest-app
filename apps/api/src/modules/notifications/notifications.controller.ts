import { Controller, Get, Patch, Delete, Param, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { NotificationsService } from './notifications.service';
import { NotificationQueryDto } from './notifications.dto';
import type { User } from '@prisma/client';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  async getNotifications(@CurrentUser() user: User, @Query() dto: NotificationQueryDto) {
    return this.notifications.getNotifications(user.id, dto);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markAsRead(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notifications.markAsRead(user.id, id);
  }

  @Patch('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    return this.notifications.markAllAsRead(user.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete notification' })
  async deleteNotification(@CurrentUser() user: User, @Param('id') id: string) {
    return this.notifications.deleteNotification(user.id, id);
  }
}
