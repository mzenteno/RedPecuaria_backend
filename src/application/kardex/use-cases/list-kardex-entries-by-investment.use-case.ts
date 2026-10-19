import { Inject, Injectable } from '@nestjs/common';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
  type KardexEntriesPage,
} from '@domain/kardex/repositories/kardex-entry.repository';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  INVESTMENT_TYPE_REPOSITORY,
  type InvestmentTypeRepository,
} from '@domain/investment/repositories/investment-type.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import { InvestmentTypeNotFoundException } from '@domain/investment/exceptions/investment-type-not-found.exception';
import { InvestmentInvestorNotFoundException } from '@domain/investment/exceptions/investment-investor-not-found.exception';
import { PaginationParams } from '@domain/common/paginated-result';
import { assertInvestmentOwnership } from '../assert-investment-ownership';

export interface ListKardexEntriesByInvestmentInput extends PaginationParams {
  investmentId: string;
  /** El Kardex ahora siempre se pide acotado a un inversionista puntual (a
   * pedido del usuario, 2026-10-14) — ver `assertKardexInvestor`. */
  investorUserId: string;
  companyId: string;
  /** true si quien pide el listado es de tipo Inversionista (no
   * Administrador/Super Administrador, ver `UserType.isInvestor()`) — si lo
   * es, solo puede pedir SU PROPIO `investorUserId` (ver el chequeo de
   * abajo); antes esto filtraba ventas ajenas dentro de un listado
   * compartido, ahora que el listado ya es de un único inversionista el
   * chequeo es más simple: coincide o se rechaza. */
  viewerIsInvestor: boolean;
  viewerUserId: string;
}

/** Agrega el saldo VIGENTE del inversionista (`InvestmentInvestor`, ver ese
 * archivo) al resultado del listado — distinto del saldo corrido fila por
 * fila (`runningBalance*` de cada item, histórico, calculado al leer). El
 * frontend lo muestra como "Saldo actual" arriba de la tabla (antes leía
 * `Investment.balanceQuantity`/`balanceKilos`/`total`, que ahora es el
 * agregado de TODOS los inversionistas, ya no el de uno puntual). */
export interface ListKardexEntriesByInvestmentResult extends KardexEntriesPage {
  investorBalanceQuantity: number;
  investorBalanceKilos: number;
  investorTotal: number;
  /** Si su parte está terminada, el frontend muestra el Kardex de solo
   * lectura (ver `InvestmentInvestor.isFinished`). */
  investorIsFinished: boolean;
}

@Injectable()
export class ListKardexEntriesByInvestmentUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(INVESTMENT_TYPE_REPOSITORY)
    private readonly investmentTypeRepository: InvestmentTypeRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListKardexEntriesByInvestmentInput,
  ): Promise<ListKardexEntriesByInvestmentResult> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    // Un Inversionista solo puede pedir su propio Kardex — 404 genérico (no
    // "sin permiso"), mismo criterio que `assertInvestmentOwnership` y
    // `GetKardexEntryByIdUseCase`: no confirma que el otro inversionista
    // exista ni que la inversión tenga más de uno.
    if (input.viewerIsInvestor && input.investorUserId !== input.viewerUserId) {
      throw new InvestmentNotFoundException(input.investmentId);
    }

    // Para decidir si la Baja cuenta como "Haber" (ver
    // `FindKardexEntriesParams.investmentTypeIsDinero`) — mismo patrón de
    // doble fetch que `CreateKardexEntryUseCase` (uno adentro de
    // `assertInvestmentOwnership`, otro acá para los datos que sí
    // necesita este caso de uso).
    const investment = await this.investmentRepository.findById(
      input.investmentId,
    );
    if (!investment) {
      throw new InvestmentNotFoundException(input.investmentId);
    }
    const investmentType = await this.investmentTypeRepository.findById(
      investment.investmentTypeId,
    );
    if (!investmentType) {
      throw new InvestmentTypeNotFoundException(investment.investmentTypeId);
    }

    const [page, investmentInvestor] = await Promise.all([
      this.kardexEntryRepository.findActiveByInvestment({
        investmentId: input.investmentId,
        investorUserId: input.investorUserId,
        page: input.page,
        pageSize: input.pageSize,
        search: input.search,
        investmentTypeIsDinero: investmentType.isDinero(),
      }),
      this.investmentRepository.findInvestmentInvestor(
        input.investmentId,
        input.investorUserId,
      ),
    ]);
    if (!investmentInvestor) {
      throw new InvestmentInvestorNotFoundException(
        input.investmentId,
        input.investorUserId,
      );
    }

    return {
      ...page,
      investorBalanceQuantity: investmentInvestor.balanceQuantity,
      investorBalanceKilos: investmentInvestor.balanceKilos,
      investorTotal: investmentInvestor.total,
      investorIsFinished: investmentInvestor.isFinished,
    };
  }
}
