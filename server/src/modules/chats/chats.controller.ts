import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { CurrentUser, JwtPayload } from '@common/decorators/current-user.decorator';
import { ChatsService } from './chats.service';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';
import { AddParticipantDto } from './dto/add-participant.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  @Post('direct')
  async createDirect(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateDirectChatDto,
  ) {
    return this.chatsService.createDirect(user.sub, dto);
  }

  @Post('group')
  async createGroup(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateGroupChatDto,
  ) {
    return this.chatsService.createGroup(user.sub, dto);
  }

  @Get()
  async list(@CurrentUser() user: JwtPayload) {
    return this.chatsService.listForUser(user.sub);
  }

  @Get(':chatId')
  async getDetail(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
  ) {
    return this.chatsService.getDetail(chatId, user.sub);
  }

  @Patch(':chatId')
  async updateGroup(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() dto: UpdateGroupChatDto,
  ) {
    return this.chatsService.updateGroup(chatId, user.sub, dto);
  }

  @Post(':chatId/participants')
  async addParticipant(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Body() dto: AddParticipantDto,
  ) {
    return this.chatsService.addParticipant(chatId, user.sub, dto.userId);
  }

  @Delete(':chatId/participants/:userId')
  async removeParticipant(
    @CurrentUser() user: JwtPayload,
    @Param('chatId') chatId: string,
    @Param('userId') targetUserId: string,
  ) {
    return this.chatsService.removeParticipant(chatId, user.sub, targetUserId);
  }
}
