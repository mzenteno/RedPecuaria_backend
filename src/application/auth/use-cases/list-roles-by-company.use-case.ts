import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@domain/auth/entities/role';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';

export interface ListRolesByCompanyInput {
  companyId: string;
}

@Injectable()
export class ListRolesByCompanyUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: ListRolesByCompanyInput): Promise<Role[]> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    return this.roleRepository.findActiveByCompany(input.companyId);
  }
}
