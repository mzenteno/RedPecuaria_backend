import { IsBoolean } from 'class-validator';

export class SetRoleMenuPermissionRequestDto {
  @IsBoolean()
  canView: boolean;

  @IsBoolean()
  canCreate: boolean;

  @IsBoolean()
  canEdit: boolean;

  @IsBoolean()
  canDelete: boolean;
}
