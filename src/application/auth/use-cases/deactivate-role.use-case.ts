import { Inject, Injectable } from '@nestjs/common';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';

export interface DeactivateRoleInput {
  roleId: string;
  /** Ver el mismo comentario en `UpdateRoleInput` — el rol tiene que
   * pertenecer a la empresa activa de quien pide desactivarlo. */
  companyId: string;
}

@Injectable()
export class DeactivateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: DeactivateRoleInput): Promise<void> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    role.deactivate();
    await this.roleRepository.save(role);
  }
}
