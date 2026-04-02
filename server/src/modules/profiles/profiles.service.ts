import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '@modules/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

/** Public-safe profile fields returned for any user. */
const PUBLIC_PROFILE_SELECT = {
  id: true,
  username: true,
  name: true,
  isOnline: true,
  lastSeen: true,
  createdAt: true,
  profile: {
    select: {
      displayName: true,
      avatarUrl: true,
      bio: true,
      statusText: true,
      lastSeenAt: true,
    },
  },
} satisfies Prisma.UserSelect;

/** Profile fields returned after an update. */
const PROFILE_SELECT = {
  id: true,
  displayName: true,
  avatarUrl: true,
  bio: true,
  statusText: true,
  lastSeenAt: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProfileSelect;

export type PublicProfile = Prisma.UserGetPayload<{
  select: typeof PUBLIC_PROFILE_SELECT;
}>;

export type ProfileDetail = Prisma.ProfileGetPayload<{
  select: typeof PROFILE_SELECT;
}>;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUsername(username: string): Promise<PublicProfile> {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: PUBLIC_PROFILE_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateMyProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileDetail> {
    // Build only the fields that were actually sent.
    const fields: Prisma.ProfileUncheckedUpdateInput = {};
    if (dto.displayName !== undefined) fields.displayName = dto.displayName;
    if (dto.bio !== undefined) fields.bio = dto.bio;
    if (dto.statusText !== undefined) fields.statusText = dto.statusText;
    if (dto.avatarUrl !== undefined) fields.avatarUrl = dto.avatarUrl;

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      update: fields,
      create: {
        userId,
        displayName: dto.displayName,
        bio: dto.bio,
        statusText: dto.statusText,
        avatarUrl: dto.avatarUrl,
      },
      select: PROFILE_SELECT,
    });

    return profile;
  }
}
