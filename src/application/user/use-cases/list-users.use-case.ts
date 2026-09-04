import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '@domain/common/paginated-result';
import { User } from '@domain/user/entities/user';
import {
  USER_REPOSITORY,
  type UserRepository,
  type ListUsersParams,
} from '@domain/user/repositories/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(params: ListUsersParams): Promise<PaginatedResult<User>> {
    return this.userRepository.findAllPaginated(params);
  }
}
