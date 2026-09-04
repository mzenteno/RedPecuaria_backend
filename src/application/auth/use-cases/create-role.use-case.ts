import { Inject, Injectable } from '@nestjs/common';
import { Role } from '@domain/auth/entities/role';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleAlreadyExistsException } from '@domain/auth/exceptions/role-already-exists.exception';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';

export interface CreateRoleInput {
  companyId: string;
  name: string;
}

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const existing = await this.roleRepository.findByCompanyAndName(
      input.companyId,
      input.name,
    );
    if (existing) {
      throw new RoleAlreadyExistsException(input.name);
    }

    const role = Role.create({ companyId: input.companyId, name: input.name });
    return this.roleRepository.save(role);
  }
}
