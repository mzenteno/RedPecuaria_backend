import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { SetRoleMenuPermissionUseCase } from '@application/auth/use-cases/set-role-menu-permission.use-case';
import { ListPermissionsByRoleUseCase } from '@application/auth/use-cases/list-permissions-by-role.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { SetRoleMenuPermissionRequestDto } from './dto/set-role-menu-permission.request.dto';
import { RoleMenuPermissionResponseDto } from './dto/role-menu-permission.response.dto';
import { RoleMenuPermissionMapper } from './role-menu-permission.mapper';

@Controller()
export class PermissionController {
  constructor(
    private readonly setRoleMenuPermissionUseCase: SetRoleMenuPermissionUseCase,
    private readonly listPermissionsByRoleUseCase: ListPermissionsByRoleUseCase,
  ) {}

  @Put('roles/:roleId/menus/:menuId/permissions')
  async set(
    @Param('roleId') roleId: string,
    @Param('menuId') menuId: string,
    @Body() dto: SetRoleMenuPermissionRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<RoleMenuPermissionResponseDto> {
    const permission = await this.setRoleMenuPermissionUseCase.execute({
      roleId,
      companyId,
      menuId,
      ...dto,
    });
    return RoleMenuPermissionMapper.toResponse(permission);
  }

  @Get('roles/:roleId/permissions')
  async listByRole(
    @Param('roleId') roleId: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<RoleMenuPermissionResponseDto[]> {
    const permissions = await this.listPermissionsByRoleUseCase.execute({
      roleId,
      companyId,
    });
    return permissions.map((permission) =>
      RoleMenuPermissionMapper.toResponse(permission),
    );
  }
}
