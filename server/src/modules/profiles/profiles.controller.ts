import { Controller, Get, Patch, Param, Body } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { CurrentUser, JwtPayload } from '@common/decorators/current-user.decorator';
import { ProfilesService, PublicProfile, ProfileDetail } from './profiles.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profilesService: ProfilesService) {}

  @Public()
  @Get(':username')
  async getByUsername(
    @Param('username') username: string,
  ): Promise<PublicProfile> {
    return this.profilesService.findByUsername(username);
  }

  @Patch('me')
  async updateMyProfile(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateProfileDto,
  ): Promise<ProfileDetail> {
    return this.profilesService.updateMyProfile(user.sub, dto);
  }
}
