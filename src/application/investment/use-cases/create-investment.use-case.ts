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

export interface CreateInvestmentInput {
  propertyId: string;
  companyId: string;
  gestion: number;
  description: string;
  investorUserIds: string[];
}

/**
 * Crea una inversión y le asigna sus inversionistas, en una sola
 * transacción (cabecera + detalle no pueden quedar inconsistentes, ver
 * ARCHITECTURE.md §7 — mismo criterio que `RegisterUserUseCase`).
 */
@Injectable()
export class CreateInvestmentUseCase {
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

  async execute(
    input: CreateInvestmentInput,
  ): Promise<{ investment: Investment; propertyName: string }> {
    const property = await this.propertyRepository.findById(input.propertyId);
    if (!property || property.companyId !== input.companyId) {
      throw new PropertyNotFoundException(input.propertyId);
    }

    await validateInvestors(input.investorUserIds, input.companyId, {
      userRepository: this.userRepository,
      userTypeRepository: this.userTypeRepository,
      userCompanyRepository: this.userCompanyRepository,
    });

    const investment = await this.transactionManager.run(async (ctx) => {
      const investment = Investment.create({
        propertyId: input.propertyId,
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
    // `property` ya está cargada (arriba, para validar) — se reusa su
    // nombre en vez de que el controller pida el catálogo aparte.
    return { investment, propertyName: property.name };
  }
}
