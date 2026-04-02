import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { JwtPayload } from '@common/decorators/current-user.decorator';
import { PresenceService } from './presence.service';

interface AuthenticatedSocket extends Socket {
  data: { user: JwtPayload };
}

function buildCorsOrigins(): string[] {
  const clientUrl = process.env.CLIENT_URL ?? 'http://localhost:3000';
  const extra = process.env.CORS_ALLOWED_ORIGINS;
  const origins = [clientUrl];
  if (extra) {
    origins.push(...extra.split(',').map((o) => o.trim()).filter(Boolean));
  }
  return origins;
}

@WebSocketGateway({
  namespace: '/',
  cors: {
    origin: buildCorsOrigins(),
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly presenceService: PresenceService,
  ) {}

  // ── Connection lifecycle ────────────────────────────

  async handleConnection(socket: AuthenticatedSocket): Promise<void> {
    try {
      const token =
        socket.handshake.auth?.['token'] ??
        socket.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        socket.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<JwtPayload>(token);
      socket.data.user = payload;

      await this.presenceService.addSocket(payload.sub, socket.id);
      await this.presenceService.setOnline(payload.sub);

      // Join all chat rooms this user belongs to
      const chatIds = await this.presenceService.getUserChats(payload.sub);
      for (const chatId of chatIds) {
        await socket.join(`chat:${chatId}`);
      }

      // Broadcast presence to rooms
      for (const chatId of chatIds) {
        socket.to(`chat:${chatId}`).emit('presence:update', {
          userId: payload.sub,
          status: 'online',
          lastSeenAt: new Date().toISOString(),
        });
      }

      this.logger.debug(`Socket connected: ${payload.username} (${socket.id})`);
    } catch {
      socket.disconnect(true);
    }
  }

  async handleDisconnect(socket: AuthenticatedSocket): Promise<void> {
    const user = socket.data?.user;
    if (!user) return;

    const noSocketsLeft = await this.presenceService.removeSocket(
      user.sub,
      socket.id,
    );

    if (noSocketsLeft) {
      await this.presenceService.setOffline(user.sub);

      const chatIds = await this.presenceService.getUserChats(user.sub);
      const now = new Date().toISOString();
      for (const chatId of chatIds) {
        this.server.to(`chat:${chatId}`).emit('presence:update', {
          userId: user.sub,
          status: 'offline',
          lastSeenAt: now,
        });
      }
    }

    this.logger.debug(`Socket disconnected: ${user.username} (${socket.id})`);
  }

  // ── Typing ──────────────────────────────────────────

  @SubscribeMessage('typing:start')
  async handleTypingStart(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    if (!socket.rooms.has(`chat:${data.chatId}`)) return;

    const user = socket.data.user;
    await this.presenceService.setTyping(data.chatId, user.sub);

    socket.to(`chat:${data.chatId}`).emit('typing:start', {
      chatId: data.chatId,
      userId: user.sub,
      username: user.username,
    });
  }

  @SubscribeMessage('typing:stop')
  async handleTypingStop(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    if (!socket.rooms.has(`chat:${data.chatId}`)) return;

    const user = socket.data.user;
    await this.presenceService.clearTyping(data.chatId, user.sub);

    socket.to(`chat:${data.chatId}`).emit('typing:stop', {
      chatId: data.chatId,
      userId: user.sub,
    });
  }

  // ── Chat room management ────────────────────────────

  @SubscribeMessage('chat:join')
  async handleJoinChat(
    @ConnectedSocket() socket: AuthenticatedSocket,
    @MessageBody() data: { chatId: string },
  ): Promise<void> {
    // Only join if user is a participant (verified via presence service)
    const chatIds = await this.presenceService.getUserChats(
      socket.data.user.sub,
    );
    if (chatIds.includes(data.chatId)) {
      await socket.join(`chat:${data.chatId}`);
    }
  }

  // ── Server-side emitters (called by services) ──────

  emitNewMessage(chatId: string, message: unknown): void {
    this.server.to(`chat:${chatId}`).emit('message:new', message);
  }

  emitMessageUpdate(chatId: string, message: unknown): void {
    this.server.to(`chat:${chatId}`).emit('message:update', message);
  }

  emitMessageDelete(chatId: string, message: unknown): void {
    this.server.to(`chat:${chatId}`).emit('message:delete', message);
  }

  emitReadUpdate(chatId: string, readReceipt: unknown): void {
    this.server.to(`chat:${chatId}`).emit('message:read:update', readReceipt);
  }

  async emitNotification(userId: string, notification: unknown): Promise<void> {
    const socketIds = await this.presenceService.getSocketIds(userId);
    for (const socketId of socketIds) {
      this.server.to(socketId).emit('notification:new', notification);
    }
  }
}
