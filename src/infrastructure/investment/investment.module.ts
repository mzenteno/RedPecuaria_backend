import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INVESTMENT_REPOSITORY } from '@domain/investment/repositories/investment.repository';
import { INVESTMENT_TYPE_REPOSITORY } from '@domain/investment/repositories/investment-type.repository';
import { InvestmentEntity } from './entities/investment.entity';
import { InvestmentInvestorEntity } from './entities/investment-investor.entity';
import { InvestmentTypeEntity } from './entities/investment-type.entity';
import { InvestmentRepositoryAdapter } from './repositories/investment.repository.adapter';
import { InvestmentTypeRepositoryAdapter } from './repositories/investment-type.repository.adapter';
import { CreateInvestmentUseCase } from '@application/investment/use-cases/create-investment.use-case';
import { UpdateInvestmentUseCase } from '@application/investment/use-cases/update-investment.use-case';
import { DeactivateInvestmentUseCase } from '@application/investment/use-cases/deactivate-investment.use-case';
import { ListInvestmentsByPropertyPaginatedUseCase } from '@application/investment/use-cases/list-investments-by-property-paginated.use-case';
import { ListInvestmentsByInvestorUseCase } from '@application/investment/use-cases/list-investments-by-investor.use-case';
import { ListInvestmentsByGestionUseCase } from '@application/investment/use-cases/list-investments-by-gestion.use-case';
import { GetInvestmentByIdUseCase } from '@application/investment/use-cases/get-investment-by-id.use-case';
import { ListInvestmentTypesUseCase } from '@application/investment/use-cases/list-investment-types.use-case';
import { InvestmentController } from './http/investment.controller';
import { InvestmentTypeController } from './http/investment-type.controller';
import { PropertyModule } from '@infrastructure/property/property.module';
import { UserModule } from '@infrastructure/user/user.module';
import { AuthModule } from '@infrastructure/auth/auth.module';

/**
 * Inversión — depende de `Property` (a qué propiedad va), `User`/`UserType`
 * (quién puede ser inversionista) y `UserCompany` (que ese usuario
 * pertenezca a la empresa activa). Ninguno de esos módulos depende de este,
 * así que no hace falta `forwardRef` (a diferencia de `User`↔`Auth`).
 *
 * `INVESTMENT_TYPE_REPOSITORY` se exporta igual que `INVESTMENT_REPOSITORY`
 * — `KardexModule` lo necesita (los casos de uso de Kardex resuelven el
 * `InvestmentType` de la inversión antes de aplicar un delta, ver
 * `computeMovementDelta`).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      InvestmentEntity,
      InvestmentInvestorEntity,
      InvestmentTypeEntity,
    ]),
    PropertyModule,
    UserModule,
    AuthModule,
  ],
  controllers: [InvestmentController, InvestmentTypeController],
  providers: [
    { provide: INVESTMENT_REPOSITORY, useClass: InvestmentRepositoryAdapter },
    {
      provide: INVESTMENT_TYPE_REPOSITORY,
      useClass: InvestmentTypeRepositoryAdapter,
    },
    CreateInvestmentUseCase,
    UpdateInvestmentUseCase,
    DeactivateInvestmentUseCase,
    ListInvestmentsByPropertyPaginatedUseCase,
    ListInvestmentsByInvestorUseCase,
    ListInvestmentsByGestionUseCase,
    GetInvestmentByIdUseCase,
    ListInvestmentTypesUseCase,
  ],
  exports: [INVESTMENT_REPOSITORY, INVESTMENT_TYPE_REPOSITORY],
})
export class InvestmentModule {}
