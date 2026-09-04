import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { KARDEX_ENTRY_REPOSITORY } from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryEntity } from './entities/kardex-entry.entity';
import { KardexEntryRepositoryAdapter } from './repositories/kardex-entry.repository.adapter';
import { CreateKardexEntryUseCase } from '@application/kardex/use-cases/create-kardex-entry.use-case';
import { UpdateKardexEntryUseCase } from '@application/kardex/use-cases/update-kardex-entry.use-case';
import { DeactivateKardexEntryUseCase } from '@application/kardex/use-cases/deactivate-kardex-entry.use-case';
import { ListKardexEntriesByInvestmentUseCase } from '@application/kardex/use-cases/list-kardex-entries-by-investment.use-case';
import { KardexEntryController } from './http/kardex-entry.controller';
import { InvestmentModule } from '@infrastructure/investment/investment.module';
import { PropertyModule } from '@infrastructure/property/property.module';

/** Kardex — ficha de movimientos de una `Investment`, ver docs/investment. */
@Module({
  imports: [
    TypeOrmModule.forFeature([KardexEntryEntity]),
    InvestmentModule,
    PropertyModule,
  ],
  controllers: [KardexEntryController],
  providers: [
    {
      provide: KARDEX_ENTRY_REPOSITORY,
      useClass: KardexEntryRepositoryAdapter,
    },
    CreateKardexEntryUseCase,
    UpdateKardexEntryUseCase,
    DeactivateKardexEntryUseCase,
    ListKardexEntriesByInvestmentUseCase,
  ],
})
export class KardexModule {}
