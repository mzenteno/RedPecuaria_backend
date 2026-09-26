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
import { Investment } from '@domain/investment/entities/investment';
import { resolveInvestmentTypeNames } from '../resolve-investment-type-names';

export interface ListInvestmentsByPropertyPaginatedInput extends PaginationParams {
  propertyId: string;
  companyId: string;
  gestion?: number;
  investorUserId?: string;
}

export interface InvestmentWithInvestors {
  investment: Investment;
  investorIds: string[];
  /** Resuelto acá (no con un segundo fetch aparte cruzado a mano del lado
   * del cliente — bug real, ver el change de este cambio) — mismo criterio
   * que `userTypeName`/`movementTypeName`. Esta lista está acotada a UNA
   * propiedad, así que se resuelve una sola vez y se reusa para todas las
   * filas (no hace falta pedirla por inversión). */
  propertyName: string;
  /** Igual criterio que `propertyName`, pero acá el catálogo completo son
   * solo 2 filas (`kilo`/`dinero`) — se resuelve una sola vez para TODO el
   * listado (`resolveInvestmentTypeNames`), no una por propiedad. */
  investmentTypeName: string;
}

/**
 * Para la pantalla de Inversiones: "Propiedad" también puede ser el único
 * filtro elegido (sin "Gestión" ni "Inversionista") y disparar la consulta
 * por sí sola, paginado en el servidor — antes solo "Gestión" e
 * "Inversionista" podían disparar la consulta, dejando a "Propiedad" sola
 * sin ningún efecto.
 */
@Injectable()
export class ListInvestmentsByPropertyPaginatedUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(INVESTMENT_TYPE_REPOSITORY)
    private readonly investmentTypeRepository: InvestmentTypeRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListInvestmentsByPropertyPaginatedInput,
  ): Promise<PaginatedResult<InvestmentWithInvestors>> {
    const result =
      await this.investmentRepository.findActiveByPropertyPaginated(input);
    // Esta lista está acotada a UNA propiedad (`input.propertyId`) — se
    // resuelve una sola vez y se reusa para todas las filas. Si
    // `result.items` viene vacío (propiedad de otra empresa, ya filtrada
    // en el SQL por `companyId`) no hace falta ni pedirla.
    const propertyName =
      result.items.length > 0
        ? ((await this.propertyRepository.findById(input.propertyId))?.name ??
          '—')
        : '';
    const investmentTypeNames = await resolveInvestmentTypeNames(
      this.investmentTypeRepository,
    );
    const items = await Promise.all(
      result.items.map(async (investment) => ({
        investment,
        investorIds: await this.investmentRepository.findInvestorIds(
          investment.id,
        ),
        propertyName,
        investmentTypeName:
          investmentTypeNames.get(investment.investmentTypeId) ?? '—',
      })),
    );
    return { ...result, items };
  }
}
