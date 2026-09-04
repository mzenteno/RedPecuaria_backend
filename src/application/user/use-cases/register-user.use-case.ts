import { Inject, Injectable } from '@nestjs/common';
import { User } from '@domain/user/entities/user';
import { Email } from '@domain/user/value-objects/email.vo';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import { UsernameAlreadyRegisteredException } from '@domain/user/exceptions/username-already-registered.exception';
import { UserTypeNotFoundException } from '@domain/user/exceptions/user-type-not-found.exception';
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
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { UserCompany } from '@domain/auth/entities/user-company';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@domain/core/ports/password-hasher.port';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';

export interface RegisterUserInput {
  username: string;
  email: string;
  password: string;
  fullName: string;
  userTypeId: string;
  /** Nunca la manda el cliente a mano — sale de `@CurrentUser('companyId')`
   * en el controller (la "empresa activa" de la sesión: fija para un
   * usuario normal, la elegida por un Super Administrador vía
   * `SwitchCompanyUseCase`). Antes se aceptaba como campo libre del body:
   * cualquiera podía registrar un usuario en cualquier empresa. */
  companyId: string;
  roleId: string;
}

/**
 * Da de alta un usuario nuevo. Por regla de negocio (ver docs/user/user.md) no
 * existe un "usuario sin empresa": el alta siempre asigna, en la misma
 * transacción, un rol dentro de una empresa concreta (User + UserCompany —
 * ver ARCHITECTURE.md §7, cabecera + detalle no pueden quedar inconsistentes).
 * El identificador único de login es `username` — el email puede repetirse.
 */
@Injectable()
export class RegisterUserUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: RegisterUserInput): Promise<User> {
    const email = Email.create(input.email);

    const existingUser = await this.userRepository.findByUsername(
      input.username,
    );
    if (existingUser) {
      throw new UsernameAlreadyRegisteredException(input.username);
    }

    const userType = await this.userTypeRepository.findById(input.userTypeId);
    if (!userType) {
      throw new UserTypeNotFoundException(input.userTypeId);
    }

    const company = await this.companyRepository.findById(input.companyId);
    if (!company) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    const passwordHash = await this.passwordHasher.hash(input.password);

    return this.transactionManager.run(async (ctx) => {
      const user = User.create({
        username: input.username,
        email,
        passwordHash,
        fullName: input.fullName,
        userTypeId: input.userTypeId,
      });
      const savedUser = await this.userRepository.save(user, ctx);

      const userCompany = UserCompany.create({
        userId: savedUser.id,
        companyId: input.companyId,
        roleId: input.roleId,
      });
      await this.userCompanyRepository.save(userCompany, ctx);

      return savedUser;
    });
  }
}
