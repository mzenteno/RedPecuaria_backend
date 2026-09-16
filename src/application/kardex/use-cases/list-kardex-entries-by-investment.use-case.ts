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
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PaginationParams } from '@domain/common/paginated-result';
import { assertInvestmentOwnership } from '../assert-investment-ownership';

export interface ListKardexEntriesByInvestmentInput extends PaginationParams {
  investmentId: string;
  companyId: string;
  /** true si quien pide el listado es de tipo Inversionista (no
   * Administrador/Super Administrador, ver `UserType.isInvestor()`) —
   * decide si se le filtran las ventas de otros inversionistas. */
  viewerIsInvestor: boolean;
  viewerUserId: string;
}

@Injectable()
export class ListKardexEntriesByInvestmentUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListKardexEntriesByInvestmentInput,
  ): Promise<KardexEntriesPage> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    return this.kardexEntryRepository.findActiveByInvestment({
      investmentId: input.investmentId,
      page: input.page,
      pageSize: input.pageSize,
      search: input.search,
      restrictSalesToInvestorId: input.viewerIsInvestor
        ? input.viewerUserId
        : undefined,
    });
  }
}
