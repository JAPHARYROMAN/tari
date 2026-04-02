import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisService } from '@modules/redis/redis.service';

const SOCKET_MAP_KEY = 'tari:sockets'; // hash: userId → Set<socketId> (stored as JSON array)
const TYPING_PREFIX = 'tari:typing:';  // key per chat: tari:typing:{chatId} hash userId → "1"
const TYPING_TTL = 10; // seconds

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  // ── Socket mapping ──────────────────────────────────

  async addSocket(userId: string, socketId: string): Promise<void> {
    const existing = await this.redis.hget(SOCKET_MAP_KEY, userId);
    const sockets: string[] = existing ? JSON.parse(existing) : [];
    if (!sockets.includes(socketId)) {
      sockets.push(socketId);
    }
    await this.redis.hset(SOCKET_MAP_KEY, userId, JSON.stringify(sockets));
  }

  async removeSocket(userId: string, socketId: string): Promise<boolean> {
    const existing = await this.redis.hget(SOCKET_MAP_KEY, userId);
    if (!existing) return true;

    const sockets: string[] = JSON.parse(existing);
    const filtered = sockets.filter((s) => s !== socketId);

    if (filtered.length === 0) {
      await this.redis.hdel(SOCKET_MAP_KEY, userId);
      return true; // no sockets left
    }

    await this.redis.hset(SOCKET_MAP_KEY, userId, JSON.stringify(filtered));
    return false; // still has sockets
  }

  async getSocketIds(userId: string): Promise<string[]> {
    const val = await this.redis.hget(SOCKET_MAP_KEY, userId);
    return val ? JSON.parse(val) : [];
  }

  // ── Presence ────────────────────────────────────────

  async setOnline(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: true, lastSeen: new Date() },
    });
    this.logger.debug(`User ${userId} online`);
  }

  async setOffline(userId: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isOnline: false, lastSeen: new Date() },
    });
    this.logger.debug(`User ${userId} offline`);
  }

  // ── Typing ──────────────────────────────────────────

  async setTyping(chatId: string, userId: string): Promise<void> {
    const key = `${TYPING_PREFIX}${chatId}`;
    await this.redis.hset(key, userId, '1');
    await this.redis.expire(key, TYPING_TTL);
  }

  async clearTyping(chatId: string, userId: string): Promise<void> {
    const key = `${TYPING_PREFIX}${chatId}`;
    await this.redis.hdel(key, userId);
  }

  // ── Helpers ─────────────────────────────────────────

  async getUserChats(userId: string): Promise<string[]> {
    const participants = await this.prisma.chatParticipant.findMany({
      where: { userId },
      select: { chatId: true },
    });
    return participants.map((p) => p.chatId);
  }
}
