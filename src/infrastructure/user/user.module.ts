import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { USER_REPOSITORY } from '@domain/user/repositories/user.repository';
import { USER_TYPE_REPOSITORY } from '@domain/user/repositories/user-type.repository';
import { UserEntity } from './entities/user.entity';
import { UserRepositoryAdapter } from './repositories/user.repository.adapter';
import { UserTypeEntity } from './entities/user-type.entity';
import { UserTypeRepositoryAdapter } from './repositories/user-type.repository.adapter';
import { CompanyModule } from '@infrastructure/company/company.module';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { RegisterUserUseCase } from '@application/user/use-cases/register-user.use-case';
import { UpdateUserUseCase } from '@application/user/use-cases/update-user.use-case';
import { DeactivateUserUseCase } from '@application/user/use-cases/deactivate-user.use-case';
import { ChangeUserTypeUseCase } from '@application/user/use-cases/change-user-type.use-case';
import { ChangeOwnPasswordUseCase } from '@application/user/use-cases/change-own-password.use-case';
import { ListUserTypesUseCase } from '@application/user/use-cases/list-user-types.use-case';
import { ListUsersUseCase } from '@application/user/use-cases/list-users.use-case';
import { ListUserOptionsUseCase } from '@application/user/use-cases/list-user-options.use-case';
import { GetUserByIdUseCase } from '@application/user/use-cases/get-user-by-id.use-case';
import { UserController } from './http/user.controller';
import { UserTypeController } from './http/user-type.controller';

/**
 * Identidad de una persona (User) y su clasificación informativa (UserType).
 * Ver docs/user/user.md y docs/user-type/user-type.md.
 *
 * Importa `AuthModule` con `forwardRef` porque `RegisterUserUseCase` necesita
 * `RoleRepository`/`UserCompanyRepository` (de auth), y a su vez
 * `AssignUserToCompanyUseCase`/`ListUserCompaniesByUserUseCase` (en auth)
 * necesitan `UserRepository` (de acá) — dependencia circular real entre
 * ambos bounded contexts, resuelta con el mecanismo estándar de Nest.
 */
@Module({
  imports: [
    CompanyModule,
    forwardRef(() => AuthModule),
    TypeOrmModule.forFeature([UserEntity, UserTypeEntity]),
  ],
  controllers: [UserController, UserTypeController],
  providers: [
    { provide: USER_REPOSITORY, useClass: UserRepositoryAdapter },
    { provide: USER_TYPE_REPOSITORY, useClass: UserTypeRepositoryAdapter },
    RegisterUserUseCase,
    UpdateUserUseCase,
    DeactivateUserUseCase,
    ChangeUserTypeUseCase,
    ChangeOwnPasswordUseCase,
    ListUserTypesUseCase,
    ListUsersUseCase,
    ListUserOptionsUseCase,
    GetUserByIdUseCase,
  ],
  exports: [USER_REPOSITORY, USER_TYPE_REPOSITORY],
})
export class UserModule {}
