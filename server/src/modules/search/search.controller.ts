import { Controller, Get, Query } from '@nestjs/common';
import { CurrentUser, JwtPayload } from '@common/decorators/current-user.decorator';
import { SearchService } from './search.service';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('users')
  async searchUsers(
    @CurrentUser() user: JwtPayload,
    @Query() dto: SearchQueryDto,
  ) {
    return this.searchService.searchUsers(dto.q, user.sub);
  }

  @Get('chats')
  async searchChats(
    @CurrentUser() user: JwtPayload,
    @Query() dto: SearchQueryDto,
  ) {
    return this.searchService.searchChats(dto.q, user.sub);
  }
}
