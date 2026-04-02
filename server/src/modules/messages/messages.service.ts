import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { MessageType, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@modules/prisma/prisma.service';
import { ChatsService } from '@modules/chats/chats.service';
import { ChatGateway } from '@modules/realtime/chat.gateway';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { SendMessageDto } from './dto/send-message.dto';
import { EditMessageDto } from './dto/edit-message.dto';

const MESSAGE_SELECT = {
  id: true,
  chatId: true,
  type: true,
  content: true,
  isEdited: true,
  deletedAt: true,
  createdAt: true,
  updatedAt: true,
  replyToId: true,
  sender: {
    select: { id: true, username: true, name: true, avatarUrl: true },
  },
  replyTo: {
    select: {
      id: true,
      content: true,
      sender: { select: { id: true, username: true, name: true } },
    },
  },
  attachments: {
    select: {
      id: true,
      url: true,
      fileName: true,
      fileSize: true,
      mimeType: true,
      width: true,
      height: true,
    },
  },
} satisfies Prisma.MessageSelect;

export type SafeMessage = Prisma.MessageGetPayload<{
  select: typeof MESSAGE_SELECT;
}>;

@Injectable()
export class MessagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly chatsService: ChatsService,
    private readonly chatGateway: ChatGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  async findForChat(
    chatId: string,
    userId: string,
    cursor?: string,
    limit = 30,
  ) {
    await this.chatsService.assertUserInChat(chatId, userId);

    const take = Math.min(limit, 50);
    const where: Prisma.MessageWhereInput = { chatId };

    const messages = await this.prisma.message.findMany({
      where,
      select: MESSAGE_SELECT,
      orderBy: { createdAt: 'desc' },
      take: take + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    const hasMore = messages.length > take;
    if (hasMore) messages.pop();

    return {
      messages,
      nextCursor: hasMore ? messages[messages.length - 1]?.id : null,
    };
  }

  async send(
    chatId: string,
    senderId: string,
    dto: SendMessageDto,
  ): Promise<SafeMessage> {
    await this.chatsService.assertUserInChat(chatId, senderId);

    const type = dto.type ?? MessageType.TEXT;

    if (type === MessageType.TEXT && !dto.content) {
      throw new BadRequestException('Text messages require content');
    }
    if (
      (type === MessageType.IMAGE || type === MessageType.FILE) &&
      (!dto.attachments || dto.attachments.length === 0)
    ) {
      throw new BadRequestException('Image/file messages require attachments');
    }
    if (type === MessageType.SYSTEM) {
      throw new BadRequestException('System messages cannot be sent by users');
    }

    if (dto.replyToId) {
      const replyTarget = await this.prisma.message.findUnique({
        where: { id: dto.replyToId },
        select: { chatId: true },
      });
      if (!replyTarget || replyTarget.chatId !== chatId) {
        throw new BadRequestException('Reply target not found in this chat');
      }
    }

    const message = await this.prisma.message.create({
      data: {
        chatId,
        senderId,
        type,
        content: dto.content ?? null,
        replyToId: dto.replyToId ?? null,
        attachments: dto.attachments
          ? {
              createMany: {
                data: dto.attachments.map((a) => ({
                  url: a.url,
                  fileName: a.fileName,
                  fileSize: a.fileSize,
                  mimeType: a.mimeType,
                  width: a.width,
                  height: a.height,
                })),
              },
            }
          : undefined,
      },
      select: MESSAGE_SELECT,
    });

    // Update chat lastMessageAt
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { lastMessageAt: message.createdAt },
    });

    // Emit to all participants in the chat room
    this.chatGateway.emitNewMessage(chatId, message);

    // Create notifications for other participants (fire-and-forget, non-blocking)
    this.notifyParticipants(chatId, senderId, message, type, dto.content).catch(
      () => {/* notification failure should not fail the send */},
    );

    return message;
  }

  async edit(
    messageId: string,
    userId: string,
    dto: EditMessageDto,
  ): Promise<SafeMessage> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, deletedAt: true, type: true, chatId: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only edit your own messages');
    }
    if (message.deletedAt) {
      throw new BadRequestException('Cannot edit a deleted message');
    }
    if (message.type !== MessageType.TEXT) {
      throw new BadRequestException('Only text messages can be edited');
    }

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: { content: dto.content, isEdited: true },
      select: MESSAGE_SELECT,
    });

    this.chatGateway.emitMessageUpdate(message.chatId, updated);

    return updated;
  }

  async softDelete(messageId: string, userId: string): Promise<SafeMessage> {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { senderId: true, deletedAt: true, chatId: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    if (message.senderId !== userId) {
      throw new ForbiddenException('Can only delete your own messages');
    }
    if (message.deletedAt) {
      throw new BadRequestException('Message already deleted');
    }

    const deleted = await this.prisma.message.update({
      where: { id: messageId },
      data: { deletedAt: new Date() },
      select: MESSAGE_SELECT,
    });

    this.chatGateway.emitMessageDelete(message.chatId, deleted);

    return deleted;
  }

  async markRead(
    messageId: string,
    userId: string,
  ) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: { id: true, chatId: true },
    });

    if (!message) throw new NotFoundException('Message not found');
    await this.chatsService.assertUserInChat(message.chatId, userId);

    const readReceipt = await this.prisma.messageRead.upsert({
      where: { chatId_userId: { chatId: message.chatId, userId } },
      update: { lastReadMessageId: messageId, readAt: new Date() },
      create: {
        chatId: message.chatId,
        userId,
        lastReadMessageId: messageId,
      },
      select: {
        chatId: true,
        userId: true,
        lastReadMessageId: true,
        readAt: true,
      },
    });

    this.chatGateway.emitReadUpdate(message.chatId, readReceipt);

    return readReceipt;
  }

  // ── Private helpers ──────────────────────────────────

  private async notifyParticipants(
    chatId: string,
    senderId: string,
    message: SafeMessage,
    type: MessageType,
    content?: string,
  ): Promise<void> {
    const participants = await this.prisma.chatParticipant.findMany({
      where: { chatId, userId: { not: senderId } },
      select: { userId: true },
    });

    if (participants.length === 0) return;

    const senderName = message.sender.name;
    const preview =
      type === MessageType.IMAGE
        ? 'Sent a photo'
        : type === MessageType.FILE
          ? 'Sent a file'
          : (content?.slice(0, 80) ?? '');

    // Batch-create all notifications in one query
    await this.prisma.notification.createMany({
      data: participants.map((p) => ({
        userId: p.userId,
        type: NotificationType.MESSAGE,
        title: `New message from ${senderName}`,
        body: preview,
        data: { chatId, messageId: message.id },
      })),
    });

    // Emit realtime events (non-blocking)
    for (const p of participants) {
      // Lightweight emit — notification list will be refetched by the client
      this.chatGateway.emitNotification(p.userId, {
        type: NotificationType.MESSAGE,
        title: `New message from ${senderName}`,
        body: preview,
        data: { chatId, messageId: message.id },
      });
    }
  }
}
