import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import { InvalidCurrentPasswordException } from '@domain/user/exceptions/invalid-current-password.exception';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@domain/core/ports/password-hasher.port';

export interface ChangeOwnPasswordInput {
  /** Siempre `@CurrentUser('sub')` en el controller, nunca un parámetro del
   * cliente — a diferencia de `ChangeUserTypeUseCase` (un admin actuando
   * sobre otro usuario), acá no hace falta validar pertenencia a una
   * empresa: el usuario solo puede cambiar SU PROPIA contraseña. */
  userId: string;
  currentPassword: string;
  newPassword: string;
}

/** Requiere la contraseña actual (a diferencia de `UpdateUserUseCase`,
 * que edita email/fullName sin pedir nada más) — es una acción sensible,
 * no basta con estar logueado para poder cambiarla. */
@Injectable()
export class ChangeOwnPasswordUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(input: ChangeOwnPasswordInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const currentPasswordMatches = await this.passwordHasher.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentPasswordMatches) {
      throw new InvalidCurrentPasswordException();
    }

    const newPasswordHash = await this.passwordHasher.hash(input.newPassword);
    user.changePassword(newPasswordHash);
    await this.userRepository.save(user);
  }
}
