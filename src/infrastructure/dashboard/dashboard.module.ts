import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DASHBOARD_REPOSITORY } from '@domain/dashboard/repositories/dashboard.repository';
import { KardexEntryEntity } from '@infrastructure/kardex/entities/kardex-entry.entity';
import { InvestmentEntity } from '@infrastructure/investment/entities/investment.entity';
import { PropertyEntity } from '@infrastructure/property/entities/property.entity';
import { DashboardRepositoryAdapter } from './repositories/dashboard.repository.adapter';
import { DashboardController } from './http/dashboard.controller';
import { GetInvestorDashboardUseCase } from '@application/dashboard/use-cases/get-investor-dashboard.use-case';
import { GetAdminDashboardUseCase } from '@application/dashboard/use-cases/get-admin-dashboard.use-case';

/**
 * Modelo de lectura transversal (Propiedades + Inversiones + Kardex +
 * Usuarios) — no un bounded context propio con sus propias reglas de
 * negocio, por eso registra de nuevo las entidades de otros módulos vía
 * `TypeOrmModule.forFeature` en vez de importar esos módulos y depender de
 * sus repositorios (pensados para su propio CRUD, no para este reporte).
 * Ver el comentario de `DashboardRepositoryAdapter`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      KardexEntryEntity,
      InvestmentEntity,
      PropertyEntity,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    { provide: DASHBOARD_REPOSITORY, useClass: DashboardRepositoryAdapter },
    GetInvestorDashboardUseCase,
    GetAdminDashboardUseCase,
  ],
})
export class DashboardModule {}
