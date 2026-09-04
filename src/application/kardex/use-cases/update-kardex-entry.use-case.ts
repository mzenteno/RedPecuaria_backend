import { Inject, Injectable } from '@nestjs/common';
import {
  KardexEntry,
  KardexEntryFields,
} from '@domain/kardex/entities/kardex-entry';
import {
  KARDEX_ENTRY_REPOSITORY,
  type KardexEntryRepository,
} from '@domain/kardex/repositories/kardex-entry.repository';
import { KardexEntryNotFoundException } from '@domain/kardex/exceptions/kardex-entry-not-found.exception';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { assertInvestmentOwnership } from '../assert-investment-ownership';

export interface UpdateKardexEntryInput extends KardexEntryFields {
  entryId: string;
  companyId: string;
}

@Injectable()
export class UpdateKardexEntryUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: UpdateKardexEntryInput): Promise<KardexEntry> {
    const entry = await this.kardexEntryRepository.findById(input.entryId);
    if (!entry) {
      throw new KardexEntryNotFoundException(input.entryId);
    }

    await assertInvestmentOwnership(entry.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    entry.update({
      entryDate: input.entryDate,
      detail: input.detail,
      avgWeight: input.avgWeight,
      entryQuantity: input.entryQuantity,
      entryKilos: input.entryKilos,
      exitQuantity: input.exitQuantity,
      exitKilos: input.exitKilos,
      balanceQuantity: input.balanceQuantity,
      balanceKilos: input.balanceKilos,
      total: input.total,
    });
    return this.kardexEntryRepository.save(entry);
  }
}
