export class RoleMenuPermissionResponseDto {
  id: string;
  roleId: string;
  menuId: string;
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  isDeleted: boolean;
}
