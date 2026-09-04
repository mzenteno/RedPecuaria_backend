import { Inject, Injectable } from '@nestjs/common';
import { Menu } from '@domain/auth/entities/menu';
import { RoleMenuPermission } from '@domain/auth/entities/role-menu-permission';
import {
  MENU_REPOSITORY,
  type MenuRepository,
} from '@domain/auth/repositories/menu.repository';
import {
  ROLE_MENU_PERMISSION_REPOSITORY,
  type RoleMenuPermissionRepository,
} from '@domain/auth/repositories/role-menu-permission.repository';
import {
  ROLE_REPOSITORY,
  type RoleRepository,
} from '@domain/auth/repositories/role.repository';
import { RoleNotFoundException } from '@domain/auth/exceptions/role-not-found.exception';

export interface GetAuthorizedMenuInput {
  /** Ausente solo para un Super Administrador sin fila propia en la empresa
   * activa (ver `AccessTokenPayload.roleId`) — en ese caso `isSuperAdmin`
   * hace innecesaria esta consulta por rol. */
  roleId?: string;
  isSuperAdmin: boolean;
}

export interface AuthorizedMenuItem {
  menu: Menu;
  /** `null` = no hay fila de permiso para este rol+menú (sin acceso configurado todavía). */
  permission: RoleMenuPermission | null;
}

/**
 * Entrega el catálogo completo de menús activos, cada uno con el permiso del
 * rol sobre él (o `null` si no tiene ninguno configurado). A propósito NO
 * filtra ni arma el árbol final — según docs/menu/menu.md, esa inferencia
 * (mostrar un menú padre puramente organizativo si al menos un hijo es
 * visible) es responsabilidad del frontend, que necesita ver el catálogo
 * completo (no solo lo visible) para poder resolverla.
 */
@Injectable()
export class GetAuthorizedMenuUseCase {
  constructor(
    @Inject(MENU_REPOSITORY) private readonly menuRepository: MenuRepository,
    @Inject(ROLE_MENU_PERMISSION_REPOSITORY)
    private readonly roleMenuPermissionRepository: RoleMenuPermissionRepository,
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
  ) {}

  async execute(input: GetAuthorizedMenuInput): Promise<AuthorizedMenuItem[]> {
    if (input.isSuperAdmin) {
      // Un Super Administrador tiene acceso completo a todo, sin depender de
      // que existan filas de `role_menu_permissions` para un rol suyo en la
      // empresa activa (que puede ni siquiera tener, ver `SwitchCompanyUseCase`).
      const menus = await this.menuRepository.findAllActive();
      return menus.map((menu) => ({
        menu,
        permission: RoleMenuPermission.create({
          roleId: '0',
          menuId: menu.id,
          canView: true,
          canCreate: true,
          canEdit: true,
          canDelete: true,
        }),
      }));
    }

    if (!input.roleId) {
      // No debería pasar nunca: todo usuario que no es Super Administrador
      // siempre tiene un `roleId` real (ver `AccessTokenPayload.roleId`).
      throw new Error(
        'Falta roleId para un usuario que no es Super Administrador',
      );
    }

    const role = await this.roleRepository.findById(input.roleId);
    if (!role) {
      throw new RoleNotFoundException(input.roleId);
    }

    const [menus, permissions] = await Promise.all([
      this.menuRepository.findAllActive(),
      this.roleMenuPermissionRepository.findByRole(input.roleId),
    ]);

    const permissionByMenuId = new Map(permissions.map((p) => [p.menuId, p]));

    return menus.map((menu) => ({
      menu,
      permission: permissionByMenuId.get(menu.id) ?? null,
    }));
  }
}
