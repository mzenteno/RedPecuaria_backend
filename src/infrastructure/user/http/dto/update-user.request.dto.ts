import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class UpdateUserRequestDto {
  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName: string;
}
