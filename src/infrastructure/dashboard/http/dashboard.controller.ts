import { Controller, Get } from '@nestjs/common';
import { GetInvestorDashboardUseCase } from '@application/dashboard/use-cases/get-investor-dashboard.use-case';
import { GetAdminDashboardUseCase } from '@application/dashboard/use-cases/get-admin-dashboard.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import type {
  InvestorDashboardSummary,
  AdminDashboardSummary,
} from '@domain/dashboard/repositories/dashboard.repository';

/**
 * Sin DTO/mapper propios a propósito (a diferencia del resto de los
 * controllers) — es un modelo de lectura puro, sin entidad de dominio con
 * invariantes que proteger: el shape que arma el repositorio YA es el que
 * viaja por HTTP, no hay nada que "mapear". Ver `docs/dashboard/
 * dashboard.md`.
 *
 * Sin chequeo de `isInvestor`/`isSuperAdmin` acá — mismo criterio (y misma
 * limitación documentada) que el resto de la app: la autorización real es
 * client-side (qué pantalla se muestra según el token), no hay guard de
 * permisos por rol a nivel de backend todavía (ver ARCHITECTURE.md §4 del
 * frontend).
 */
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly getInvestorDashboardUseCase: GetInvestorDashboardUseCase,
    private readonly getAdminDashboardUseCase: GetAdminDashboardUseCase,
  ) {}

  @Get('investor-summary')
  async investorSummary(
    @CurrentUser('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
  ): Promise<InvestorDashboardSummary> {
    return this.getInvestorDashboardUseCase.execute({ companyId, userId });
  }

  @Get('admin-summary')
  async adminSummary(
    @CurrentUser('companyId') companyId: string,
  ): Promise<AdminDashboardSummary> {
    return this.getAdminDashboardUseCase.execute({ companyId });
  }
}
