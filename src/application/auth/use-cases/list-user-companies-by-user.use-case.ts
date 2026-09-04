import { Inject, Injectable } from '@nestjs/common';
import { UserCompany } from '@domain/auth/entities/user-company';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';

export interface ListUserCompaniesByUserInput {
  userId: string;
}

@Injectable()
export class ListUserCompaniesByUserUseCase {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
  ) {}

  async execute(input: ListUserCompaniesByUserInput): Promise<UserCompany[]> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    return this.userCompanyRepository.findActiveByUserId(input.userId);
  }
}
