import { IsString, MinLength } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  @MinLength(1)
  userId!: string;
}
