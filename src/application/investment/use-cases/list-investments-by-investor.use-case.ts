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

export interface ListInvestmentsByInvestorInput extends PaginationParams {
  /** En `mine` sale siempre de la sesión (`@CurrentUser('sub')`), nunca de
   * un parámetro del cliente — es "mis inversiones". En `by-investor` es
   * explícito, elegido en un combo (un administrador buscando a cualquier
   * inversionista de su empresa). */
  investorUserId: string;
  companyId: string;
  /** Solo lo manda `by-investor` — `mine` nunca lo usa. */
  propertyId?: string;
}

/**
 * Para "Mis inversiones" (Kardex) y para buscar-por-inversionista
 * (Inversiones): sus propias inversiones (donde aparece en
 * `investment_investors`), sin importar de qué propiedad sean — a
 * diferencia de `ListInvestmentsByPropertyUseCase` (para el CRUD de
 * Inversiones, que elige una propiedad primero). Paginado en el servidor.
 */
@Injectable()
export class ListInvestmentsByInvestorUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
  ) {}

  async execute(
    input: ListInvestmentsByInvestorInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result = await this.investmentRepository.findByInvestor(input);
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
