import { Inject, Injectable } from '@nestjs/common';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import type { InvestmentWithInvestors } from './list-investments-by-property-paginated.use-case';

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
 * diferencia de `ListInvestmentsByPropertyPaginatedUseCase` (para el CRUD de
 * Inversiones, que elige una propiedad primero). Paginado en el servidor.
 */
@Injectable()
export class ListInvestmentsByInvestorUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListInvestmentsByInvestorInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result = await this.investmentRepository.findByInvestor(input);
    // Un inversionista puede participar en inversiones de distintas
    // propiedades — hay que resolver el nombre por fila (usado tanto por
    // "by-investor" como por "mine", ver `ListMyInvestmentsQueryDto`).
    const items = await Promise.all(
      result.items.map(async (investment) => {
        const [investorIds, property] = await Promise.all([
          this.investmentRepository.findInvestorIds(investment.id),
          this.propertyRepository.findById(investment.propertyId),
        ]);
        return { investment, investorIds, propertyName: property?.name ?? '—' };
      }),
    );
    return { ...result, items };
  }
}
