import { IsString, MinLength } from 'class-validator';

export class ChangeUserTypeRequestDto {
  @IsString()
  @MinLength(1)
  userTypeId: string;
}
