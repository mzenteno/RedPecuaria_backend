import { Inject, Injectable } from '@nestjs/common';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import type { InvestmentWithInvestors } from './list-investments-by-property.use-case';

export interface ListInvestmentsByGestionInput extends PaginationParams {
  gestion: number;
  companyId: string;
  propertyId?: string;
  investorUserId?: string;
}

/**
 * Para la pantalla de Inversiones: "Gestión" es el filtro que dispara la
 * consulta (de cualquier propiedad de la empresa), paginado en el servidor
 * — "Propiedad"/"Inversionista" son filtros opcionales adicionales,
 * resueltos también en el servidor (con paginación real, filtrar solo la
 * página ya traída del lado del cliente daría un resultado incompleto).
 */
@Injectable()
export class ListInvestmentsByGestionUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
  ) {}

  async execute(
    input: ListInvestmentsByGestionInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result =
      await this.investmentRepository.findActiveByCompanyAndGestion(input);
    const items = await Promise.all(
      result.items.map(async (investment) => ({
        investment,
        investorIds: await this.investmentRepository.findInvestorIds(
          investment.id,
        ),
      })),
    );
    return { ...result, items };
  }
}
