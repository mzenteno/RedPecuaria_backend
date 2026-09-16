import { Inject, Injectable } from '@nestjs/common';
import { User } from '@domain/user/entities/user';
import {
  USER_REPOSITORY,
  type UserRepository,
  type FindUserOptionsParams,
} from '@domain/user/repositories/user.repository';

/**
 * Para combos (Inversionista en `InvestmentDialog`) — a propósito separado
 * de `ListUsersUseCase` (el CRUD paginado): un `<select>` no pagina,
 * necesita todas las opciones de una vez, no una página con `id`+`fullName`
 * nada más (ver `UserOptionResponseDto`).
 */
@Injectable()
export class ListUserOptionsUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(params: FindUserOptionsParams): Promise<User[]> {
    return this.userRepository.findOptions(params);
  }
}
