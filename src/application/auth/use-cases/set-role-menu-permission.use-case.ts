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
import {
  MENU_REPOSITORY,
  type MenuRepository,
} from '@domain/auth/repositories/menu.repository';
import { MenuNotFoundException } from '@domain/auth/exceptions/menu-not-found.exception';

export interface SetRoleMenuPermissionInput {
  roleId: string;
  /** El rol tiene que pertenecer a la empresa activa de quien asigna el
   * permiso — mismo criterio que `UpdateRoleUseCase`/`DeactivateRoleUseCase`. */
  companyId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

/**
 * Asigna (crea o actualiza) los permisos de un rol sobre un menú. Es un
 * upsert porque el par (roleId, menuId) es único — "asignar permisos" en el
 * lenguaje de negocio no distingue entre la primera vez y una corrección.
 */
@Injectable()
export class SetRoleMenuPermissionUseCase {
  constructor(
    @Inject(ROLE_MENU_PERMISSION_REPOSITORY)
    private readonly roleMenuPermissionRepository: RoleMenuPermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
  ) {}

  async execute(
    input: SetRoleMenuPermissionInput,
  ): Promise<RoleMenuPermission> {
    const role = await this.roleRepository.findById(input.roleId);
    if (!role || role.companyId !== input.companyId) {
      throw new RoleNotFoundException(input.roleId);
    }

    const menu = await this.menuRepository.findById(input.menuId);
    if (!menu) {
      throw new MenuNotFoundException(input.menuId);
    }

    const props = {
      canView: input.canView,
      canCreate: input.canCreate,
      canEdit: input.canEdit,
      canDelete: input.canDelete,
    };

    const existing = await this.roleMenuPermissionRepository.findByRoleAndMenu(
      input.roleId,
      input.menuId,
    );
    if (existing) {
      existing.update(props);
      return this.roleMenuPermissionRepository.save(existing);
    }

    const permission = RoleMenuPermission.create({
      roleId: input.roleId,
      menuId: input.menuId,
      ...props,
    });
    return this.roleMenuPermissionRepository.save(permission);
  }
}
