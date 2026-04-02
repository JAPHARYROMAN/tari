import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { PrismaService } from '@modules/prisma/prisma.service';
import { JwtPayload } from '@common/decorators/current-user.decorator';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import type { AuthResponse, AuthTokens } from './interfaces/auth-response.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly refreshExpiration: string;
  private readonly refreshExpirationMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {
    this.refreshExpiration = this.config.get<string>(
      'jwt.refreshExpiration',
      '7d',
    );
    this.refreshExpirationMs = this.parseExpirationToMs(this.refreshExpiration);
  }

  // ── Register ─────────────────────────────────────────

  async register(
    dto: RegisterDto,
    meta: RequestMeta,
  ): Promise<AuthResponse> {
    await this.ensureUniqueUser(dto.email, dto.username);

    const hashedPassword = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        username: dto.username.toLowerCase().trim(),
        password: hashedPassword,
        name: dto.name.trim(),
      },
    });

    const tokens = await this.issueTokens(
      { sub: user.id, email: user.email, username: user.username },
      meta,
    );

    this.logger.log(`User registered: ${user.username}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  // ── Login ────────────────────────────────────────────

  async login(
    dto: LoginDto,
    meta: RequestMeta,
  ): Promise<AuthResponse> {
    const identifier = dto.emailOrUsername.toLowerCase().trim();

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: identifier }, { username: identifier }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await argon2.verify(user.password, dto.password);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const tokens = await this.issueTokens(
      { sub: user.id, email: user.email, username: user.username },
      meta,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: { isOnline: true, lastSeen: new Date() },
    });

    this.logger.log(`User logged in: ${user.username}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      tokens,
    };
  }

  // ── Refresh ──────────────────────────────────────────

  async refresh(
    refreshToken: string,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt < new Date()) {
      await this.prisma.session.delete({ where: { id: session.id } });
      throw new UnauthorizedException('Refresh token has expired');
    }

    // Rotate: delete old session, issue new token pair
    await this.prisma.session.delete({ where: { id: session.id } });

    const tokens = await this.issueTokens(
      {
        sub: session.user.id,
        email: session.user.email,
        username: session.user.username,
      },
      meta,
    );

    this.logger.debug(`Token rotated for user: ${session.user.username}`);

    return tokens;
  }

  // ── Logout ───────────────────────────────────────────

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);

    const session = await this.prisma.session.findFirst({
      where: { tokenHash },
      select: { id: true, userId: true },
    });

    if (!session) {
      // Silently succeed — token already revoked or invalid
      return;
    }

    await this.prisma.session.delete({ where: { id: session.id } });

    // Check if user has any remaining sessions
    const remainingSessions = await this.prisma.session.count({
      where: { userId: session.userId },
    });

    if (remainingSessions === 0) {
      await this.prisma.user.update({
        where: { id: session.userId },
        data: { isOnline: false, lastSeen: new Date() },
      });
    }

    this.logger.debug(`Session revoked for user: ${session.userId}`);
  }

  // ── Private helpers ──────────────────────────────────

  private async issueTokens(
    payload: JwtPayload,
    meta: RequestMeta,
  ): Promise<AuthTokens> {
    const accessToken = this.jwt.sign(payload);

    const rawRefreshToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);

    await this.prisma.session.create({
      data: {
        userId: payload.sub,
        tokenHash,
        userAgent: meta.userAgent ?? null,
        ipAddress: meta.ipAddress ?? null,
        expiresAt: new Date(Date.now() + this.refreshExpirationMs),
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async ensureUniqueUser(
    email: string,
    username: string,
  ): Promise<void> {
    const normalizedEmail = email.toLowerCase().trim();
    const normalizedUsername = username.toLowerCase().trim();

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: normalizedEmail },
          { username: normalizedUsername },
        ],
      },
      select: { email: true, username: true },
    });

    if (!existing) return;

    if (existing.email === normalizedEmail) {
      throw new ConflictException('Email is already registered');
    }

    throw new ConflictException('Username is already taken');
  }

  private parseExpirationToMs(expiration: string): number {
    const units: Record<string, number> = {
      s: 1_000,
      m: 60_000,
      h: 3_600_000,
      d: 86_400_000,
      w: 604_800_000,
    };

    const match = expiration.match(/^(\d+)([smhdw])$/);
    if (!match) {
      throw new Error(`Invalid expiration format: ${expiration}`);
    }

    const value = parseInt(match[1]!, 10);
    const unit = units[match[2]!];

    return value * unit!;
  }
}

export interface RequestMeta {
  userAgent?: string;
  ipAddress?: string;
}
