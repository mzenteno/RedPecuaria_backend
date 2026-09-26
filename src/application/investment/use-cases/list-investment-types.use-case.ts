import { Inject, Injectable } from '@nestjs/common';
import { InvestmentType } from '@domain/investment/entities/investment-type';
import {
  INVESTMENT_TYPE_REPOSITORY,
  type InvestmentTypeRepository,
} from '@domain/investment/repositories/investment-type.repository';

@Injectable()
export class ListInvestmentTypesUseCase {
  constructor(
    @Inject(INVESTMENT_TYPE_REPOSITORY)
    private readonly investmentTypeRepository: InvestmentTypeRepository,
  ) {}

  async execute(): Promise<InvestmentType[]> {
    return this.investmentTypeRepository.findAll();
  }
}
