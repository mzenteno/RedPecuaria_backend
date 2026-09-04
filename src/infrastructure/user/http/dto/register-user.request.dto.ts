import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterUserRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  username: string;

  @IsEmail()
  @MaxLength(255)
  email: string;

  @IsString()
  @MinLength(1)
  password: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  fullName: string;

  @IsString()
  @MinLength(1)
  userTypeId: string;

  // Sin `companyId`: el alta siempre es sobre la empresa activa de la sesión
  // (`@CurrentUser('companyId')` en el controller), nunca un valor libre del
  // body — ver `RegisterUserInput`.

  @IsString()
  @MinLength(1)
  roleId: string;
}
