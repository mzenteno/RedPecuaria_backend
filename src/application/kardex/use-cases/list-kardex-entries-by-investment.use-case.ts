import { Inject, Injectable } from '@nestjs/common';
import { KardexEntry } from '@domain/kardex/entities/kardex-entry';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
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
import { assertInvestmentOwnership } from '../assert-investment-ownership';

export interface ListKardexEntriesByInvestmentInput extends PaginationParams {
  investmentId: string;
  companyId: string;
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
  ): Promise<PaginatedResult<KardexEntry>> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    return this.kardexEntryRepository.findActiveByInvestment(input);
  }
}
