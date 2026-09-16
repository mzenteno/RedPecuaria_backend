import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KARDEX_ENTRY_REPOSITORY } from '@domain/kardex/repositories/kardex-entry.repository';
import { MOVEMENT_TYPE_REPOSITORY } from '@domain/kardex/repositories/movement-type.repository';
import { KardexEntryEntity } from './entities/kardex-entry.entity';
import { KardexMovementTypeEntity } from './entities/kardex-movement-type.entity';
import { KardexEntryRepositoryAdapter } from './repositories/kardex-entry.repository.adapter';
import { MovementTypeRepositoryAdapter } from './repositories/movement-type.repository.adapter';
import { CreateKardexEntryUseCase } from '@application/kardex/use-cases/create-kardex-entry.use-case';
import { UpdateKardexEntryUseCase } from '@application/kardex/use-cases/update-kardex-entry.use-case';
import { DeactivateKardexEntryUseCase } from '@application/kardex/use-cases/deactivate-kardex-entry.use-case';
import { ListKardexEntriesByInvestmentUseCase } from '@application/kardex/use-cases/list-kardex-entries-by-investment.use-case';
import { GetKardexEntryByIdUseCase } from '@application/kardex/use-cases/get-kardex-entry-by-id.use-case';
import { ListMovementTypesUseCase } from '@application/kardex/use-cases/list-movement-types.use-case';
import { KardexEntryController } from './http/kardex-entry.controller';
import { MovementTypeController } from './http/movement-type.controller';
import { InvestmentModule } from '@infrastructure/investment/investment.module';
import { PropertyModule } from '@infrastructure/property/property.module';

/** Kardex — ficha de movimientos de una `Investment`, ver docs/investment. */
@Module({
  imports: [
    TypeOrmModule.forFeature([KardexEntryEntity, KardexMovementTypeEntity]),
    InvestmentModule,
    PropertyModule,
  ],
  controllers: [KardexEntryController, MovementTypeController],
  providers: [
    {
      provide: KARDEX_ENTRY_REPOSITORY,
      useClass: KardexEntryRepositoryAdapter,
    },
    {
      provide: MOVEMENT_TYPE_REPOSITORY,
      useClass: MovementTypeRepositoryAdapter,
    },
    CreateKardexEntryUseCase,
    UpdateKardexEntryUseCase,
    DeactivateKardexEntryUseCase,
    ListKardexEntriesByInvestmentUseCase,
    GetKardexEntryByIdUseCase,
    ListMovementTypesUseCase,
  ],
})
export class KardexModule {}
