import { Inject, Injectable } from '@nestjs/common';
import { Investment } from '@domain/investment/entities/investment';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { PropertyNotFoundException } from '@domain/property/exceptions/property-not-found.exception';

export interface ListInvestmentsByPropertyInput {
  propertyId: string;
  companyId: string;
}

export interface InvestmentWithInvestors {
  investment: Investment;
  investorIds: string[];
}

/** Trae, de una, los ids de los inversionistas de cada inversión — evita que
 * el frontend tenga que pedir cada una por separado solo para saber quién
 * participa (necesario para la tabla y para precargar el diálogo de edición). */
@Injectable()
export class ListInvestmentsByPropertyUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
  ) {}

  async execute(
    input: ListInvestmentsByPropertyInput,
  ): Promise<InvestmentWithInvestors[]> {
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property || property.companyId !== input.companyId) {
      throw new PropertyNotFoundException(input.propertyId);
    }

    const investments = await this.investmentRepository.findActiveByProperty(
      input.propertyId,
    );
    return Promise.all(
      investments.map(async (investment) => ({
        investment,
        investorIds: await this.investmentRepository.findInvestorIds(
          investment.id,
        ),
      })),
    );
  }
}
