import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { CurrentUser, JwtPayload } from '@common/decorators/current-user.decorator';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';

@Controller()
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('chats/:chatId/messages')
  async list(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: number,
  ) {
    return this.messagesService.findForChat(chatId, user.sub, cursor, limit);
  }

  @Post('chats/:chatId/messages')
  async send(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.send(chatId, user.sub, dto);
  }

  @Patch('messages/:messageId')
  async edit(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
    @Body() dto: EditMessageDto,
  ) {
    return this.messagesService.edit(messageId, user.sub, dto);
  }

  @Delete('messages/:messageId')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.softDelete(messageId, user.sub);
  }

  @Post('messages/:messageId/read')
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Param('messageId') messageId: string,
  ) {
    return this.messagesService.markRead(messageId, user.sub);
  }
}
