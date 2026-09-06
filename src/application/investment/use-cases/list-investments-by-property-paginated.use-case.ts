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

export interface ListInvestmentsByPropertyPaginatedInput extends PaginationParams {
  propertyId: string;
  companyId: string;
  gestion?: number;
  investorUserId?: string;
}

/**
 * Para la pantalla de Inversiones: "Propiedad" también puede ser el único
 * filtro elegido (sin "Gestión" ni "Inversionista") y disparar la consulta
 * por sí sola, paginado en el servidor — antes solo "Gestión" e
 * "Inversionista" podían disparar la consulta, dejando a "Propiedad" sola
 * sin ningún efecto. Distinto de `ListInvestmentsByPropertyUseCase` (sin
 * paginar, usado por el atajo "Ver kardex" — se deja sin tocar).
 */
@Injectable()
export class ListInvestmentsByPropertyPaginatedUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
  ) {}

  async execute(
    input: ListInvestmentsByPropertyPaginatedInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result =
      await this.investmentRepository.findActiveByPropertyPaginated(input);
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
