import { Inject, Injectable } from '@nestjs/common';
import { RoleMenuPermission } from '@domain/auth/entities/role-menu-permission';
import {
  ROLE_MENU_PERMISSION_REPOSITORY,
  type RoleMenuPermissionRepository,
} from '@domain/auth/repositories/role-menu-permission.repository';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';

export interface ListPermissionsByRoleInput {
  roleId: string;
  /** El rol tiene que pertenecer a la empresa activa de quien pide sus
   * permisos — mismo criterio que el resto de los casos de uso de `Role`. */
  companyId: string;
}

@Injectable()
export class ListPermissionsByRoleUseCase {
  constructor(
    @Inject(ROLE_MENU_PERMISSION_REPOSITORY)
    private readonly roleMenuPermissionRepository: RoleMenuPermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(
    input: ListPermissionsByRoleInput,
  ): Promise<RoleMenuPermission[]> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    return this.roleMenuPermissionRepository.findByRole(input.roleId);
  }
}
