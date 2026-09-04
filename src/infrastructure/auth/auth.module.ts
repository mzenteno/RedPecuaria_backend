import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ROLE_REPOSITORY } from '@domain/auth/repositories/role.repository';
import { ROLE_MENU_PERMISSION_REPOSITORY } from '@domain/auth/repositories/role-menu-permission.repository';
import { USER_COMPANY_REPOSITORY } from '@domain/auth/repositories/user-company.repository';
import { MENU_REPOSITORY } from '@domain/auth/repositories/menu.repository';
import { REFRESH_TOKEN_REPOSITORY } from '@domain/auth/repositories/refresh-token.repository';
import { CompanyModule } from '@infrastructure/company/company.module';
import { UserModule } from '@infrastructure/user/user.module';
import { RoleEntity } from './entities/role.entity';
import { RoleRepositoryAdapter } from './repositories/role.repository.adapter';
import { RoleMenuPermissionEntity } from './entities/role-menu-permission.entity';
import { RoleMenuPermissionRepositoryAdapter } from './repositories/role-menu-permission.repository.adapter';
import { UserCompanyEntity } from './entities/user-company.entity';
import { UserCompanyRepositoryAdapter } from './repositories/user-company.repository.adapter';
import { MenuEntity } from './entities/menu.entity';
import { MenuRepositoryAdapter } from './repositories/menu.repository.adapter';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { RefreshTokenRepositoryAdapter } from './repositories/refresh-token.repository.adapter';
import { AuthSessionsController } from './http/auth-sessions.controller';
import { MeController } from './http/me.controller';
import { RoleController } from './http/role.controller';
import { PermissionController } from './http/permission.controller';
import { UserCompanyController } from './http/user-company.controller';
import { MenuController } from './http/menu.controller';
import { LoginUseCase } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '@application/auth/use-cases/logout.use-case';
import { CreateRoleUseCase } from '@application/auth/use-cases/create-role.use-case';
import { UpdateRoleUseCase } from '@application/auth/use-cases/update-role.use-case';
import { DeactivateRoleUseCase } from '@application/auth/use-cases/deactivate-role.use-case';
import { ListRolesByCompanyUseCase } from '@application/auth/use-cases/list-roles-by-company.use-case';
import { ListActiveMenusUseCase } from '@application/auth/use-cases/list-active-menus.use-case';
import { SetRoleMenuPermissionUseCase } from '@application/auth/use-cases/set-role-menu-permission.use-case';
import { ListPermissionsByRoleUseCase } from '@application/auth/use-cases/list-permissions-by-role.use-case';
import { AssignUserToCompanyUseCase } from '@application/auth/use-cases/assign-user-to-company.use-case';
import { ChangeUserCompanyRoleUseCase } from '@application/auth/use-cases/change-user-company-role.use-case';
import { DeactivateUserCompanyUseCase } from '@application/auth/use-cases/deactivate-user-company.use-case';
import { ListUserCompaniesByUserUseCase } from '@application/auth/use-cases/list-user-companies-by-user.use-case';
import { GetAuthorizedMenuUseCase } from '@application/auth/use-cases/get-authorized-menu.use-case';
import { SwitchCompanyUseCase } from '@application/auth/use-cases/switch-company.use-case';
import { GetUserRoleInCompanyUseCase } from '@application/auth/use-cases/get-user-role-in-company.use-case';

/**
 * Autenticación y autorización: roles por empresa, sus permisos por menú, la
 * asignación de un rol a un usuario dentro de una empresa (UserCompany), y el
 * catálogo de menús. Más adelante (Fase 8-9) también vive acá JWT/sesiones.
 * Ver docs/role, docs/permission, docs/user-company, docs/menu.
 *
 * Importa `UserModule` con `forwardRef` — ver el comentario simétrico en
 * `user.module.ts` sobre la dependencia circular real entre ambos módulos.
 */
@Module({
  imports: [
    CompanyModule,
    forwardRef(() => UserModule),
    TypeOrmModule.forFeature([
      RoleEntity,
      RoleMenuPermissionEntity,
      UserCompanyEntity,
      MenuEntity,
      RefreshTokenEntity,
    ]),
  ],
  controllers: [
    AuthSessionsController,
    MeController,
    RoleController,
    PermissionController,
    UserCompanyController,
    MenuController,
  ],
  providers: [
    { provide: ROLE_REPOSITORY, useClass: RoleRepositoryAdapter },
    {
      provide: ROLE_MENU_PERMISSION_REPOSITORY,
      useClass: RoleMenuPermissionRepositoryAdapter,
    },
    {
      provide: USER_COMPANY_REPOSITORY,
      useClass: UserCompanyRepositoryAdapter,
    },
    { provide: MENU_REPOSITORY, useClass: MenuRepositoryAdapter },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepositoryAdapter,
    },
    CreateRoleUseCase,
    UpdateRoleUseCase,
    DeactivateRoleUseCase,
    ListRolesByCompanyUseCase,
    ListActiveMenusUseCase,
    SetRoleMenuPermissionUseCase,
    ListPermissionsByRoleUseCase,
    AssignUserToCompanyUseCase,
    ChangeUserCompanyRoleUseCase,
    DeactivateUserCompanyUseCase,
    ListUserCompaniesByUserUseCase,
    GetAuthorizedMenuUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    SwitchCompanyUseCase,
    GetUserRoleInCompanyUseCase,
  ],
  exports: [
    ROLE_REPOSITORY,
    ROLE_MENU_PERMISSION_REPOSITORY,
    USER_COMPANY_REPOSITORY,
    MENU_REPOSITORY,
    REFRESH_TOKEN_REPOSITORY,
  ],
})
export class AuthModule {}
