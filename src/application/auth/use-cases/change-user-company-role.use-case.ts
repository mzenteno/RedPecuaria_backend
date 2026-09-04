import { Inject, Injectable } from '@nestjs/common';
import { UserCompany } from '@domain/auth/entities/user-company';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { UserCompanyNotFoundException } from '@domain/auth/exceptions/user-company-not-found.exception';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';

export interface ChangeUserCompanyRoleInput {
  userCompanyId: string;
  /** Empresa activa de quien hace el cambio — el vínculo tiene que ser de
   * esa empresa. Sin este chequeo, cualquiera con sesión podía reasignar el
   * rol de un usuario de **otra** empresa adivinando el id del vínculo
   * (mismo hueco ya cerrado en `Role`/`Permission`, ver docs/role/role.md). */
  companyId: string;
  roleId: string;
}

@Injectable()
export class ChangeUserCompanyRoleUseCase {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: ChangeUserCompanyRoleInput): Promise<UserCompany> {
    const userCompany = await this.userCompanyRepository.findById(
      input.userCompanyId,
    );
    if (!userCompany || userCompany.companyId !== input.companyId) {
      throw new UserCompanyNotFoundException(input.userCompanyId);
    }

    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== userCompany.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    userCompany.changeRole(input.roleId);
    return this.userCompanyRepository.save(userCompany);
  }
}
