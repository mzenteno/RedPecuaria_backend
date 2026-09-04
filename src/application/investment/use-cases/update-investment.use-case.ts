import { Inject, Injectable } from '@nestjs/common';
import { Investment } from '@domain/investment/entities/investment';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';
import { validateInvestors } from '../validate-investors';

export interface UpdateInvestmentInput {
  investmentId: string;
  companyId: string;
  gestion: number;
  description: string;
  investorUserIds: string[];
}

@Injectable()
export class UpdateInvestmentUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: UpdateInvestmentInput): Promise<Investment> {
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

    await validateInvestors(input.investorUserIds, input.companyId, {
      userRepository: this.userRepository,
      userTypeRepository: this.userTypeRepository,
      userCompanyRepository: this.userCompanyRepository,
    });

    return this.transactionManager.run(async (ctx) => {
      investment.update({
        gestion: input.gestion,
        description: input.description,
      });
      const saved = await this.investmentRepository.save(investment, ctx);
      await this.investmentRepository.replaceInvestors(
        saved.id,
        input.investorUserIds,
        ctx,
      );
      return saved;
    });
  }
}
