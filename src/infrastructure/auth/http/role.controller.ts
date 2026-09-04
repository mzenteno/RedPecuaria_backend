import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CreateRoleUseCase } from '@application/auth/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '@application/auth/use-cases/update-role.use-case';
import { DeactivateRoleUseCase } from '@application/auth/use-cases/deactivate-role.use-case';
import { ListRolesByCompanyUseCase } from '@application/auth/use-cases/list-roles-by-company.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { CreateRoleRequestDto } from './dto/create-role.request.dto';
import { UpdateRoleRequestDto } from './dto/update-role.request.dto';
import { RoleResponseDto } from './dto/role.response.dto';
import { RoleMapper } from './role.mapper';

/**
 * Sin `companyId` en la URL a propósito (antes era `POST/GET
 * companies/:companyId/roles`, cualquiera podía crear/listar roles de
 * cualquier empresa cambiando el parámetro): siempre es sobre la empresa
 * activa de la sesión (`@CurrentUser('companyId')`), mismo criterio que
 * `UserController` — ver ARCHITECTURE.md.
 */
@Controller('roles')
export class RoleController {
  constructor(
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly updateRoleUseCase: UpdateRoleUseCase,
    private readonly deactivateRoleUseCase: DeactivateRoleUseCase,
    private readonly listRolesByCompanyUseCase: ListRolesByCompanyUseCase,
  ) {}

  @Post()
  async create(
    @Body() dto: CreateRoleRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<RoleResponseDto> {
    const role = await this.createRoleUseCase.execute({
      companyId,
      name: dto.name,
    });
    return RoleMapper.toResponse(role);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<RoleResponseDto> {
    const role = await this.updateRoleUseCase.execute({
      roleId: id,
      companyId,
      name: dto.name,
    });
    return RoleMapper.toResponse(role);
  }

  @Patch(':id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(
    @Param('id') id: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<void> {
    await this.deactivateRoleUseCase.execute({ roleId: id, companyId });
  }

  @Get()
  async list(
    @CurrentUser('companyId') companyId: string,
  ): Promise<RoleResponseDto[]> {
    const roles = await this.listRolesByCompanyUseCase.execute({ companyId });
    return roles.map((role) => RoleMapper.toResponse(role));
  }
}
