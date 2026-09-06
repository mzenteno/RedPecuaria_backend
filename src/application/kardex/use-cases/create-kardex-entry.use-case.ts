import { Inject, Injectable } from '@nestjs/common';
import {
  KardexEntry,
  KardexEntryFields,
} from '@domain/kardex/entities/kardex-entry';
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
import { assertInvestmentOwnership } from '../assert-investment-ownership';
import { assertKardexInvestor } from '../assert-kardex-investor';

export interface CreateKardexEntryInput extends KardexEntryFields {
  investmentId: string;
  companyId: string;
}

@Injectable()
export class CreateKardexEntryUseCase {
  constructor(
    @Inject(KARDEX_ENTRY_REPOSITORY)
    private readonly kardexEntryRepository: KardexEntryRepository,
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: CreateKardexEntryInput): Promise<KardexEntry> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });
    await assertKardexInvestor(
      input.movementType,
      input.investorUserId,
      input.investmentId,
      this.investmentRepository,
    );

    const entry = KardexEntry.create({
      investmentId: input.investmentId,
      fields: {
        entryDate: input.entryDate,
        detail: input.detail,
        movementType: input.movementType,
        investorUserId: input.investorUserId,
        avgWeight: input.avgWeight,
        entryQuantity: input.entryQuantity,
        entryKilos: input.entryKilos,
        exitQuantity: input.exitQuantity,
        exitKilos: input.exitKilos,
        balanceQuantity: input.balanceQuantity,
        balanceKilos: input.balanceKilos,
        total: input.total,
      },
    });
    return this.kardexEntryRepository.save(entry);
  }
}
