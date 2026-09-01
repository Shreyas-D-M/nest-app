import { Controller, Get, Post, Param, Body, Query, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto, SendMessageDto, GetMessagesDto } from './conversations.dto';
import type { User } from '@prisma/client';

@ApiTags('Conversations')
@ApiBearerAuth()
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create or get conversation for a booking' })
  async createConversation(@CurrentUser() user: User, @Body() dto: CreateConversationDto) {
    return this.conversations.createConversation(user.id, dto.bookingId);
  }

  @Get()
  @ApiOperation({ summary: 'List user conversations' })
  async getConversations(@CurrentUser() user: User) {
    return this.conversations.getConversations(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get conversation details' })
  async getConversation(@CurrentUser() user: User, @Param('id') id: string) {
    return this.conversations.getConversation(user.id, id);
  }

  @Post(':id/messages')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Send a message' })
  async sendMessage(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.conversations.sendMessage(user.id, conversationId, dto);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: 'Get messages in a conversation' })
  async getMessages(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Query() dto: GetMessagesDto,
  ) {
    return this.conversations.getMessages(user.id, conversationId, dto);
  }

  @Post(':id/messages/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark messages as read' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') conversationId: string,
    @Body() body: { messageIds: string[] },
  ) {
    return this.conversations.markAsRead(user.id, conversationId, body.messageIds);
  }
}
