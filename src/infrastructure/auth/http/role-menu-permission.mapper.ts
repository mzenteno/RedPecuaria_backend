import { RoleMenuPermission } from '@domain/auth/entities/role-menu-permission';
import { RoleMenuPermissionResponseDto } from './dto/role-menu-permission.response.dto';

export class RoleMenuPermissionMapper {
  static toResponse(
    permission: RoleMenuPermission,
  ): RoleMenuPermissionResponseDto {
    return {
      id: permission.id,
      roleId: permission.roleId,
      menuId: permission.menuId,
      canView: permission.canView,
      canCreate: permission.canCreate,
      canEdit: permission.canEdit,
      canDelete: permission.canDelete,
      isDeleted: permission.isDeleted,
    };
  }
}
