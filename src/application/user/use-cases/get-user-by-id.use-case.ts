import { Inject, Injectable } from '@nestjs/common';
import { User } from '@domain/user/entities/user';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';

/**
 * El detalle completo de un usuario, para quien lo necesite (el diálogo de
 * edición del frontend, ver `UserDialog`) — a propósito NUNCA se resuelve
 * cruzando datos del listado (`GET /users`, que a propósito solo trae lo
 * que se muestra en la tabla, ver `UserWithType`/`UserListItemResponseDto`):
 * el listado es liviano por diseño, quien necesite más campos pide el
 * registro completo por id, no reconstruye a mano lo que le falta.
 */
@Injectable()
export class GetUserByIdUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string): Promise<User> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException(userId);
    }
    return user;
  }
}
