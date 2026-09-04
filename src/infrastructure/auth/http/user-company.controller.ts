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
import { AssignUserToCompanyUseCase } from '@application/auth/use-cases/assign-user-to-company.use-case';
import { ChangeUserCompanyRoleUseCase } from '@application/auth/use-cases/change-user-company-role.use-case';
import { DeactivateUserCompanyUseCase } from '@application/auth/use-cases/deactivate-user-company.use-case';
import { ListUserCompaniesByUserUseCase } from '@application/auth/use-cases/list-user-companies-by-user.use-case';
import { GetUserRoleInCompanyUseCase } from '@application/auth/use-cases/get-user-role-in-company.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { AssignUserToCompanyRequestDto } from './dto/assign-user-to-company.request.dto';
import { ChangeUserCompanyRoleRequestDto } from './dto/change-user-company-role.request.dto';
import { UserCompanyResponseDto } from './dto/user-company.response.dto';
import { UserCompanyMapper } from './user-company.mapper';

@Controller()
export class UserCompanyController {
  constructor(
    private readonly assignUserToCompanyUseCase: AssignUserToCompanyUseCase,
    private readonly changeUserCompanyRoleUseCase: ChangeUserCompanyRoleUseCase,
    private readonly deactivateUserCompanyUseCase: DeactivateUserCompanyUseCase,
    private readonly listUserCompaniesByUserUseCase: ListUserCompaniesByUserUseCase,
    private readonly getUserRoleInCompanyUseCase: GetUserRoleInCompanyUseCase,
  ) {}

  @Post('users/:userId/companies')
  async assign(
    @Param('userId') userId: string,
    @Body() dto: AssignUserToCompanyRequestDto,
  ): Promise<UserCompanyResponseDto> {
    const userCompany = await this.assignUserToCompanyUseCase.execute({
      userId,
      companyId: dto.companyId,
      roleId: dto.roleId,
    });
    return UserCompanyMapper.toResponse(userCompany);
  }

  @Patch('user-companies/:id/role')
  async changeRole(
    @Param('id') id: string,
    @Body() dto: ChangeUserCompanyRoleRequestDto,
    @CurrentUser('companyId') companyId: string,
  ): Promise<UserCompanyResponseDto> {
    const userCompany = await this.changeUserCompanyRoleUseCase.execute({
      userCompanyId: id,
      companyId,
      roleId: dto.roleId,
    });
    return UserCompanyMapper.toResponse(userCompany);
  }

  @Get('users/:userId/role')
  async getRole(
    @Param('userId') userId: string,
    @CurrentUser('companyId') companyId: string,
  ): Promise<UserCompanyResponseDto> {
    const userCompany = await this.getUserRoleInCompanyUseCase.execute({
      userId,
      companyId,
    });
    return UserCompanyMapper.toResponse(userCompany);
  }

  @Patch('user-companies/:id/deactivate')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deactivate(@Param('id') id: string): Promise<void> {
    await this.deactivateUserCompanyUseCase.execute({ userCompanyId: id });
  }

  @Get('users/:userId/companies')
  async listByUser(
    @Param('userId') userId: string,
  ): Promise<UserCompanyResponseDto[]> {
    const userCompanies = await this.listUserCompaniesByUserUseCase.execute({
      userId,
    });
    return userCompanies.map((uc) => UserCompanyMapper.toResponse(uc));
  }
}
