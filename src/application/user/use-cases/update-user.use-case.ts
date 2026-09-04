import { Inject, Injectable } from '@nestjs/common';
import { User } from '@domain/user/entities/user';
import { Email } from '@domain/user/value-objects/email.vo';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';

export interface UpdateUserInput {
  userId: string;
  email: string;
  fullName: string;
}

/**
 * Edita el perfil de un usuario ya existente — a propósito, solo `email` y
 * `fullName` (ver `User.updateProfile`). Cambiar el `username` o la
 * contraseña, o reasignar empresa/rol, son acciones separadas que no viven
 * acá (ver docs/user/user.md).
 */
@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: UpdateUserInput): Promise<User> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    user.updateProfile({
      email: Email.create(input.email),
      fullName: input.fullName,
    });
    return this.userRepository.save(user);
  }
}
