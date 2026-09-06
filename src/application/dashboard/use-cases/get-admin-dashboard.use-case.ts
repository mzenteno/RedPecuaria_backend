import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
  type AdminDashboardSummary,
} from '@domain/dashboard/repositories/dashboard.repository';

export interface GetAdminDashboardInput {
  companyId: string;
}

@Injectable()
export class GetAdminDashboardUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  execute(input: GetAdminDashboardInput): Promise<AdminDashboardSummary> {
    return this.dashboardRepository.getAdminSummary(input.companyId);
  }
}
