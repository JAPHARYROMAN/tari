import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateGroupChatDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  description?: string;

  @IsOptional()
  @IsUrl()
  avatarUrl?: string;
}
