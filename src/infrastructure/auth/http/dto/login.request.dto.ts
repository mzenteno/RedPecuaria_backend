import { IsOptional, IsString, MinLength } from 'class-validator';

export class LoginRequestDto {
  @IsString()
  @MinLength(1)
  username: string;

  @IsString()
  @MinLength(1)
  password: string;

  /** Solo obligatorio si el usuario tiene más de una empresa activa. */
  @IsOptional()
  @IsString()
  companyId?: string;
}
