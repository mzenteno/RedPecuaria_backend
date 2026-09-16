import { Inject, Injectable } from '@nestjs/common';
import { PaginatedResult } from '@domain/common/paginated-result';
import {
  USER_REPOSITORY,
  type UserRepository,
  type ListUsersParams,
  type UserWithType,
} from '@domain/user/repositories/user.repository';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(
    params: ListUsersParams,
  ): Promise<PaginatedResult<UserWithType>> {
    return this.userRepository.findAllPaginated(params);
  }
}
