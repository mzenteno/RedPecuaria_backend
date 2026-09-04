import { Inject, Injectable } from '@nestjs/common';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';

export interface DeactivateInvestmentInput {
  investmentId: string;
  companyId: string;
}

@Injectable()
export class DeactivateInvestmentUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(input: DeactivateInvestmentInput): Promise<void> {
    const investment = await this.investmentRepository.findById(
      input.investmentId,
    );
    if (!investment) {
      throw new InvestmentNotFoundException(input.investmentId);
    }

    const property = await this.propertyRepository.findById(
      investment.propertyId,
    );
    if (!property || property.companyId !== input.companyId) {
      throw new InvestmentNotFoundException(input.investmentId);
    }

    investment.deactivate();
    await this.investmentRepository.save(investment);
  }
}
