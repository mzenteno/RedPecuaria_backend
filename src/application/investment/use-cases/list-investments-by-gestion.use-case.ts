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
  INVESTMENT_TYPE_REPOSITORY,
  type InvestmentTypeRepository,
} from '@domain/investment/repositories/investment-type.repository';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import type { InvestmentWithInvestors } from './list-investments-by-property-paginated.use-case';
import { resolveInvestmentTypeNames } from '../resolve-investment-type-names';

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
    @Inject(INVESTMENT_TYPE_REPOSITORY)
    private readonly investmentTypeRepository: InvestmentTypeRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListInvestmentsByGestionInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result =
      await this.investmentRepository.findActiveByCompanyAndGestion(input);
    // A diferencia de `ListInvestmentsByPropertyPaginatedUseCase`, acá SÍ puede haber
    // inversiones de distintas propiedades (esta lista es "de cualquier
    // propiedad de la empresa") — hay que resolver el nombre por fila.
    // `investmentTypeName` es al revés: el catálogo completo son 2 filas,
    // se resuelve una sola vez para todo el listado.
    const investmentTypeNames = await resolveInvestmentTypeNames(
      this.investmentTypeRepository,
    );
    const items = await Promise.all(
      result.items.map(async (investment) => {
        const [investorIds, property] = await Promise.all([
          this.investmentRepository.findInvestorIds(investment.id),
          this.propertyRepository.findById(investment.propertyId),
        ]);
        return {
          investment,
          investorIds,
          propertyName: property?.name ?? '—',
          investmentTypeName:
            investmentTypeNames.get(investment.investmentTypeId) ?? '—',
        };
      }),
    );
    return { ...result, items };
  }
}
