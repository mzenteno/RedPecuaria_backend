import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { INVESTMENT_REPOSITORY } from '@domain/investment/repositories/investment.repository';
import { InvestmentEntity } from './entities/investment.entity';
import { InvestmentInvestorEntity } from './entities/investment-investor.entity';
import { InvestmentRepositoryAdapter } from './repositories/investment.repository.adapter';
import { CreateInvestmentUseCase } from '@application/investment/use-cases/create-investment.use-case';
import { UpdateInvestmentUseCase } from '@application/investment/use-cases/update-investment.use-case';
import { DeactivateInvestmentUseCase } from '@application/investment/use-cases/deactivate-investment.use-case';
import { ListInvestmentsByPropertyUseCase } from '@application/investment/use-cases/list-investments-by-property.use-case';
import { ListInvestmentsByPropertyPaginatedUseCase } from '@application/investment/use-cases/list-investments-by-property-paginated.use-case';
import { ListInvestmentsByInvestorUseCase } from '@application/investment/use-cases/list-investments-by-investor.use-case';
import { ListInvestmentsByGestionUseCase } from '@application/investment/use-cases/list-investments-by-gestion.use-case';
import { InvestmentController } from './http/investment.controller';
import { PropertyModule } from '@infrastructure/property/property.module';
import { UserModule } from '@infrastructure/user/user.module';
import { AuthModule } from '@infrastructure/auth/auth.module';

/**
 * Inversión — depende de `Property` (a qué propiedad va), `User`/`UserType`
 * (quién puede ser inversionista) y `UserCompany` (que ese usuario
 * pertenezca a la empresa activa). Ninguno de esos módulos depende de este,
 * así que no hace falta `forwardRef` (a diferencia de `User`↔`Auth`).
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([InvestmentEntity, InvestmentInvestorEntity]),
    PropertyModule,
    UserModule,
    AuthModule,
  ],
  controllers: [InvestmentController],
  providers: [
    { provide: INVESTMENT_REPOSITORY, useClass: InvestmentRepositoryAdapter },
    CreateInvestmentUseCase,
    UpdateInvestmentUseCase,
    DeactivateInvestmentUseCase,
    ListInvestmentsByPropertyUseCase,
    ListInvestmentsByPropertyPaginatedUseCase,
    ListInvestmentsByInvestorUseCase,
    ListInvestmentsByGestionUseCase,
  ],
  exports: [INVESTMENT_REPOSITORY],
})
export class InvestmentModule {}
