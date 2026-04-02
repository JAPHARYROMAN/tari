import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ChatType, ChatRole, NotificationType, Prisma } from '@prisma/client';
import { PrismaService } from '@modules/prisma/prisma.service';
import { NotificationsService } from '@modules/notifications/notifications.service';
import { ChatGateway } from '@modules/realtime/chat.gateway';
import { CreateDirectChatDto } from './dto/create-direct-chat.dto';
import { CreateGroupChatDto } from './dto/create-group-chat.dto';
import { UpdateGroupChatDto } from './dto/update-group-chat.dto';

const PARTICIPANT_USER_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  isOnline: true,
  lastSeen: true,
} satisfies Prisma.UserSelect;

const CHAT_LIST_SELECT = {
  id: true,
  type: true,
  name: true,
  avatarUrl: true,
  description: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    select: {
      id: true,
      role: true,
      userId: true,
      user: { select: PARTICIPANT_USER_SELECT },
    },
  },
  messages: {
    where: { deletedAt: null },
    take: 1,
    orderBy: { createdAt: 'desc' as const },
    select: {
      id: true,
      content: true,
      type: true,
      createdAt: true,
      sender: { select: { id: true, username: true, name: true } },
    },
  },
} satisfies Prisma.ChatSelect;

const CHAT_DETAIL_SELECT = {
  id: true,
  type: true,
  name: true,
  avatarUrl: true,
  description: true,
  lastMessageAt: true,
  createdAt: true,
  updatedAt: true,
  participants: {
    select: {
      id: true,
      role: true,
      isPinned: true,
      isMuted: true,
      joinedAt: true,
      userId: true,
      user: { select: PARTICIPANT_USER_SELECT },
    },
  },
} satisfies Prisma.ChatSelect;

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly chatGateway: ChatGateway,
  ) {}

  async createDirect(userId: string, dto: CreateDirectChatDto) {
    if (userId === dto.targetUserId) {
      throw new BadRequestException('Cannot create a chat with yourself');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: dto.targetUserId },
      select: { id: true },
    });
    if (!target) {
      throw new NotFoundException('Target user not found');
    }

    // Check for existing direct chat between these two users
    const existing = await this.prisma.chat.findFirst({
      where: {
        type: ChatType.DIRECT,
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: dto.targetUserId } } },
        ],
      },
      select: CHAT_DETAIL_SELECT,
    });

    if (existing) return existing;

    return this.prisma.chat.create({
      data: {
        type: ChatType.DIRECT,
        participants: {
          createMany: {
            data: [
              { userId, role: ChatRole.MEMBER },
              { userId: dto.targetUserId, role: ChatRole.MEMBER },
            ],
          },
        },
      },
      select: CHAT_DETAIL_SELECT,
    });
  }

  async createGroup(userId: string, dto: CreateGroupChatDto) {
    // Deduplicate and exclude creator from the list
    const uniqueIds = [...new Set(dto.participantIds.filter((id) => id !== userId))];

    // Verify all participant users exist
    const existingUsers = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: { id: true },
    });
    const existingIds = new Set(existingUsers.map((u) => u.id));
    const invalidIds = uniqueIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      throw new NotFoundException(`Users not found: ${invalidIds.join(', ')}`);
    }

    const participantData = [
      { userId, role: ChatRole.ADMIN as ChatRole },
      ...uniqueIds.map((id) => ({ userId: id, role: ChatRole.MEMBER as ChatRole })),
    ];

    return this.prisma.chat.create({
      data: {
        type: ChatType.GROUP,
        name: dto.name,
        description: dto.description,
        avatarUrl: dto.avatarUrl,
        participants: { createMany: { data: participantData } },
      },
      select: CHAT_DETAIL_SELECT,
    });
  }

  async listForUser(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { participants: { some: { userId } } },
      orderBy: { lastMessageAt: 'desc' },
      select: {
        ...CHAT_LIST_SELECT,
        messageReads: {
          where: { userId },
          select: { lastReadMessageId: true },
          take: 1,
        },
      },
    });

    // Batch-fetch all cursor message timestamps in one query
    const cursorIds = chats
      .map((c) => c.messageReads[0]?.lastReadMessageId)
      .filter((id): id is string => id != null);

    const cursorMessages =
      cursorIds.length > 0
        ? await this.prisma.message.findMany({
            where: { id: { in: cursorIds } },
            select: { id: true, createdAt: true },
          })
        : [];

    const cursorMap = new Map(
      cursorMessages.map((m) => [m.id, m.createdAt]),
    );

    const chatIds = chats.map((c) => c.id);

    // Single raw query to get all unread counts at once
    const unreadCounts =
      chatIds.length > 0
        ? await this.prisma.$queryRaw<
            { chat_id: string; count: bigint }[]
          >`
            SELECT m.chat_id, COUNT(*)::bigint as count
            FROM messages m
            LEFT JOIN message_reads mr
              ON mr.chat_id = m.chat_id AND mr.user_id = ${userId}
            LEFT JOIN messages cursor_msg
              ON cursor_msg.id = mr.last_read_message_id
            WHERE m.chat_id = ANY(${chatIds})
              AND m.deleted_at IS NULL
              AND m.sender_id != ${userId}
              AND (
                cursor_msg.created_at IS NULL
                OR m.created_at > cursor_msg.created_at
              )
            GROUP BY m.chat_id
          `
        : [];

    const unreadMap = new Map(
      unreadCounts.map((r) => [r.chat_id, Number(r.count)]),
    );

    return chats.map((chat) => {
      const { messageReads: _mr, ...rest } = chat;
      return {
        ...rest,
        unreadCount: unreadMap.get(chat.id) ?? 0,
      };
    });
  }

  async getDetail(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: CHAT_DETAIL_SELECT,
    });

    if (!chat) throw new NotFoundException('Chat not found');
    this.assertParticipant(chat.participants, userId);
    return chat;
  }

  async updateGroup(chatId: string, userId: string, dto: UpdateGroupChatDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, participants: { select: { userId: true, role: true } } },
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Only group chats can be updated');
    }
    this.assertAdmin(chat.participants, userId);

    const data: Prisma.ChatUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.avatarUrl !== undefined) data.avatarUrl = dto.avatarUrl;

    return this.prisma.chat.update({
      where: { id: chatId },
      data,
      select: CHAT_DETAIL_SELECT,
    });
  }

  async addParticipant(chatId: string, userId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, participants: { select: { userId: true, role: true } } },
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Can only add participants to group chats');
    }
    this.assertAdmin(chat.participants, userId);

    if (chat.participants.some((p) => p.userId === targetUserId)) {
      throw new ConflictException('User is already a participant');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const [, chatMeta] = await Promise.all([
      this.prisma.chatParticipant.create({
        data: { chatId, userId: targetUserId, role: ChatRole.MEMBER },
      }),
      this.prisma.chat.findUnique({ where: { id: chatId }, select: { name: true } }),
    ]);

    const chatName = chatMeta?.name ?? 'a group';

    const notification = await this.notificationsService.create({
      userId: targetUserId,
      type: NotificationType.CHAT_INVITE,
      title: `You were added to ${chatName}`,
      data: { chatId },
    });
    this.chatGateway.emitNotification(targetUserId, notification);

    return this.prisma.chat.findUnique({
      where: { id: chatId },
      select: CHAT_DETAIL_SELECT,
    });
  }

  async removeParticipant(chatId: string, userId: string, targetUserId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { id: true, type: true, participants: { select: { userId: true, role: true } } },
    });

    if (!chat) throw new NotFoundException('Chat not found');
    if (chat.type !== ChatType.GROUP) {
      throw new BadRequestException('Can only remove participants from group chats');
    }

    // Users can remove themselves (leave). Admins can remove non-admins.
    if (userId !== targetUserId) {
      this.assertAdmin(chat.participants, userId);
      const target = chat.participants.find((p) => p.userId === targetUserId);
      if (!target) throw new NotFoundException('Participant not found');
      if (target.role === ChatRole.ADMIN || target.role === ChatRole.OWNER) {
        throw new ForbiddenException('Cannot remove an admin');
      }
    }

    const participant = chat.participants.find((p) => p.userId === targetUserId);
    if (!participant) throw new NotFoundException('Participant not found');

    // Prevent removing the last admin
    if (
      (participant.role === ChatRole.ADMIN || participant.role === ChatRole.OWNER) &&
      chat.participants.filter(
        (p) => (p.role === ChatRole.ADMIN || p.role === ChatRole.OWNER) && p.userId !== targetUserId,
      ).length === 0
    ) {
      throw new BadRequestException(
        'Cannot remove the last admin. Promote another member first.',
      );
    }

    await this.prisma.chatParticipant.delete({
      where: { chatId_userId: { chatId, userId: targetUserId } },
    });

    return { message: 'Participant removed' };
  }

  /** Verify userId is a member of the given chat by chatId. Used by messages module. */
  async assertUserInChat(chatId: string, userId: string): Promise<void> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: { chatId_userId: { chatId, userId } },
      select: { id: true },
    });
    if (!participant) {
      throw new ForbiddenException('Not a participant of this chat');
    }
  }

  private assertParticipant(
    participants: { userId: string }[],
    userId: string,
  ): void {
    if (!participants.some((p) => p.userId === userId)) {
      throw new ForbiddenException('Not a participant of this chat');
    }
  }

  private assertAdmin(
    participants: { userId: string; role: ChatRole }[],
    userId: string,
  ): void {
    const p = participants.find((p) => p.userId === userId);
    if (!p) throw new ForbiddenException('Not a participant of this chat');
    if (p.role !== ChatRole.ADMIN && p.role !== ChatRole.OWNER) {
      throw new ForbiddenException('Only admins can perform this action');
    }
  }
}
