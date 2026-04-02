import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@modules/prisma/prisma.service';

const USER_RESULT_SELECT = {
  id: true,
  username: true,
  name: true,
  avatarUrl: true,
  isOnline: true,
  lastSeen: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
      bio: true,
      statusText: true,
    },
  },
} satisfies Prisma.UserSelect;

const CHAT_RESULT_SELECT = {
  id: true,
  type: true,
  name: true,
  avatarUrl: true,
  description: true,
  lastMessageAt: true,
  updatedAt: true,
  participants: {
    select: {
      userId: true,
      role: true,
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          avatarUrl: true,
          isOnline: true,
        },
      },
    },
  },
} satisfies Prisma.ChatSelect;

export type UserSearchResult = Prisma.UserGetPayload<{
  select: typeof USER_RESULT_SELECT;
}>;

export type ChatSearchResult = Prisma.ChatGetPayload<{
  select: typeof CHAT_RESULT_SELECT;
}>;

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async searchUsers(
    query: string,
    currentUserId: string,
    limit = 10,
  ): Promise<UserSearchResult[]> {
    const pattern = `%${query}%`;

    return this.prisma.user.findMany({
      where: {
        id: { not: currentUserId },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } },
          {
            profile: {
              displayName: { contains: query, mode: 'insensitive' },
            },
          },
        ],
      },
      select: USER_RESULT_SELECT,
      take: limit,
      orderBy: { username: 'asc' },
    });
  }

  async searchChats(
    query: string,
    currentUserId: string,
    limit = 10,
  ): Promise<ChatSearchResult[]> {
    return this.prisma.chat.findMany({
      where: {
        participants: { some: { userId: currentUserId } },
        OR: [
          // Group chat name/description
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          // Participant name/username (works for direct chat resolution too)
          {
            participants: {
              some: {
                userId: { not: currentUserId },
                user: {
                  OR: [
                    { name: { contains: query, mode: 'insensitive' } },
                    { username: { contains: query, mode: 'insensitive' } },
                  ],
                },
              },
            },
          },
        ],
      },
      select: CHAT_RESULT_SELECT,
      take: limit,
      orderBy: { lastMessageAt: 'desc' },
    });
  }
}
