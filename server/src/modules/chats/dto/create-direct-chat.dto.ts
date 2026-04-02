import { IsString, MinLength } from 'class-validator';

export class CreateDirectChatDto {
  @IsString()
  @MinLength(1)
  targetUserId!: string;
}
