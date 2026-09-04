import { Inject, Injectable } from '@nestjs/common';
import { UserCompany } from '@domain/auth/entities/user-company';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { UserCompanyAlreadyExistsException } from '@domain/auth/exceptions/user-company-already-exists.exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';

export interface AssignUserToCompanyInput {
  userId: string;
  companyId: string;
  roleId: string;
}

/**
 * Da acceso a un usuario **ya existente** a otra empresa, con un rol dentro
 * de ella. Distinto de `RegisterUserUseCase` (que crea el `User` desde cero
 * junto con su primer `UserCompany`) — este caso de uso solo agrega un
 * vínculo nuevo para un usuario que ya existe en el sistema.
 *
 * `(userId, companyId)` es único en base de datos incluso si el vínculo está
 * desactivado (`UNIQUE(user_id, company_id)`, no condicional a `isDeleted`),
 * así que si ya existe un vínculo — activo o no — no se puede crear uno
 * nuevo; reactivar uno desactivado queda pendiente (no hay todavía un método
 * en `UserCompany` para eso).
 */
@Injectable()
export class AssignUserToCompanyUseCase {
  constructor(
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: AssignUserToCompanyInput): Promise<UserCompany> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    const existing = await this.userCompanyRepository.findByUserAndCompany(
      input.userId,
      input.companyId,
    );
    if (existing) {
      throw new UserCompanyAlreadyExistsException();
    }

    const userCompany = UserCompany.create({
      userId: input.userId,
      companyId: input.companyId,
      roleId: input.roleId,
    });
    return this.userCompanyRepository.save(userCompany);
  }
}
