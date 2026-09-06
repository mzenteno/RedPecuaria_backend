import { Inject, Injectable } from '@nestjs/common';
import {
  DASHBOARD_REPOSITORY,
  type DashboardRepository,
  type InvestorDashboardSummary,
} from '@domain/dashboard/repositories/dashboard.repository';

export interface GetInvestorDashboardInput {
  companyId: string;
  userId: string;
}

@Injectable()
export class GetInvestorDashboardUseCase {
  constructor(
    @Inject(DASHBOARD_REPOSITORY)
    private readonly dashboardRepository: DashboardRepository,
  ) {}

  execute(input: GetInvestorDashboardInput): Promise<InvestorDashboardSummary> {
    return this.dashboardRepository.getInvestorSummary(
      input.companyId,
      input.userId,
    );
  }
}
