import { Inject, Injectable } from '@nestjs/common';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { UserCompanyNotFoundException } from '@domain/auth/exceptions/user-company-not-found.exception';

export interface DeactivateUserCompanyInput {
  userCompanyId: string;
}

@Injectable()
export class DeactivateUserCompanyUseCase {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
  ) {}

  async execute(input: DeactivateUserCompanyInput): Promise<void> {
    const userCompany = await this.userCompanyRepository.findById(
      input.userCompanyId,
    );
    if (!userCompany) {
      throw new UserCompanyNotFoundException(input.userCompanyId);
    }

    userCompany.deactivate();
    await this.userCompanyRepository.save(userCompany);
  }
}
