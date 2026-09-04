import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { RoleMenuPermission } from '../entities/role-menu-permission';

export const ROLE_MENU_PERMISSION_REPOSITORY = Symbol(
  'RoleMenuPermissionRepository',
);

export interface RoleMenuPermissionRepository {
  findByRoleAndMenu(
    roleId: string,
    menuId: string,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission | null>;
  findByRole(
    roleId: string,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission[]>;
  save(
    permission: RoleMenuPermission,
    ctx?: TransactionContext,
  ): Promise<RoleMenuPermission>;
}
