import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

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

  // Opcional: obligatorio salvo que `userTypeId` sea Super Administrador
  // (`RoleRequiredException` si falta y no lo es) — un Super Administrador
  // no pertenece a ninguna empresa puntual, ver `RegisterUserUseCase`.
  @IsOptional()
  @IsString()
  @MinLength(1)
  roleId?: string;
}
