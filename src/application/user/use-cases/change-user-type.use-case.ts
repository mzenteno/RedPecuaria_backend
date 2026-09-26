import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import { UserTypeNotFoundException } from '@domain/user/exceptions/user-type-not-found.exception';
import { SuperAdminUserTypeForbiddenException } from '@domain/user/exceptions/super-admin-user-type-forbidden.exception';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';

export interface ChangeUserTypeInput {
  userId: string;
  /** El usuario objetivo tiene que pertenecer a la empresa activa de quien
   * hace el cambio — sin esto, cualquiera con sesión podía cambiar el
   * `UserType` (incluso a "Super Administrador") de un usuario de **otra**
   * empresa con la que no tiene ninguna relación, adivinando su id. Como
   * efecto colateral, esto también significa que HOY no se puede usar este
   * caso de uso para cambiarle el tipo a alguien que YA es Super
   * Administrador (cero membresías, nunca matchea ninguna empresa) — queda
   * documentado como límite conocido, no resuelto en este cambio (ver
   * docs/user-company/changes/2026-09-25-super-admin-sin-user-company.md). */
  companyId: string;
  userTypeId: string;
  /** Viene de `@CurrentUser('isSuperAdmin')` — mismo criterio que
   * `RegisterUserUseCase` (2026-09-25): solo un Super Administrador puede
   * ASCENDER a alguien a ese tipo por acá — si no se cerrara este mismo
   * agujero, la regla de "crear" se esquivaría creando un Administrador y
   * después promoviéndolo. */
  callerIsSuperAdmin: boolean;
}

@Injectable()
export class ChangeUserTypeUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: ChangeUserTypeInput): Promise<void> {
    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const membership = await this.userCompanyRepository.findByUserAndCompany(
      input.userId,
      input.companyId,
    );
    if (!membership || membership.isDeleted) {
      throw new UserNotFoundException(input.userId);
    }

    const userType = await this.userTypeRepository.findById(input.userTypeId);
    if (!userType) {
      throw new UserTypeNotFoundException(input.userTypeId);
    }
    if (userType.isSuperAdmin() && !input.callerIsSuperAdmin) {
      throw new SuperAdminUserTypeForbiddenException();
    }

    await this.transactionManager.run(async (ctx) => {
      user.changeUserType(input.userTypeId);
      await this.userRepository.save(user, ctx);

      // Un Super Administrador no pertenece a ninguna empresa puntual — al
      // ascender a alguien a ese tipo, se le desactivan TODAS sus
      // membresías activas (no solo la de esta empresa), 2026-09-25. Ver
      // docs/user-company/changes/2026-09-25-super-admin-sin-user-company.md.
      if (userType.isSuperAdmin()) {
        const memberships = await this.userCompanyRepository.findActiveByUserId(
          input.userId,
          ctx,
        );
        for (const membershipToDeactivate of memberships) {
          membershipToDeactivate.deactivate();
          await this.userCompanyRepository.save(membershipToDeactivate, ctx);
        }
      }
    });
  }
}
