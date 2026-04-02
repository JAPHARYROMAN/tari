import { Controller, Get } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '@common/decorators/current-user.decorator';
import { UsersService, SafeUser } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: JwtPayload): Promise<SafeUser> {
    return this.usersService.findMe(user.sub);
  }
}
