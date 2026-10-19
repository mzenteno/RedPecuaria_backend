import { Inject, Injectable } from '@nestjs/common';
import {
  INVESTMENT_REPOSITORY,
  type InvestmentRepository,
} from '@domain/investment/repositories/investment.repository';
import {
  PROPERTY_REPOSITORY,
  type PropertyRepository,
} from '@domain/property/repositories/property.repository';
import { InvestmentNotFoundException } from '@domain/investment/exceptions/investment-not-found.exception';
import { InvestmentInvestorNotFoundException } from '@domain/investment/exceptions/investment-investor-not-found.exception';
import {
  TRANSACTION_MANAGER,
  type TransactionManager,
} from '@domain/core/ports/transaction-manager.port';
import { assertInvestmentOwnership } from '../assert-investment-ownership';
import { syncInvestmentFinished } from '@application/investment/sync-investment-finished';

export interface SetKardexInvestorFinishedInput {
  investmentId: string;
  investorUserId: string;
  isFinished: boolean;
  companyId: string;
}

/**
 * Botón "Finalizar"/"Reactivar" del Kardex de un inversionista (a pedido
 * del usuario, 2026-10-19): "terminada" pasó a ser por inversionista, ver
 * `InvestmentInvestor.isFinished`. En la misma transacción recalcula el
 * estado derivado de la inversión completa (`syncInvestmentFinished`).
 */
@Injectable()
export class SetKardexInvestorFinishedUseCase {
  constructor(
    @Inject(INVESTMENT_REPOSITORY)
    private readonly investmentRepository: InvestmentRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: PropertyRepository,
    @Inject(TRANSACTION_MANAGER)
    private readonly transactionManager: TransactionManager,
  ) {}

  async execute(input: SetKardexInvestorFinishedInput): Promise<void> {
    await assertInvestmentOwnership(input.investmentId, input.companyId, {
      investmentRepository: this.investmentRepository,
      propertyRepository: this.propertyRepository,
    });

    await this.transactionManager.run(async (ctx) => {
      const investmentInvestor =
        await this.investmentRepository.findInvestmentInvestor(
          input.investmentId,
          input.investorUserId,
          ctx,
        );
      if (!investmentInvestor) {
        throw new InvestmentInvestorNotFoundException(
          input.investmentId,
          input.investorUserId,
        );
      }
      investmentInvestor.setFinished(input.isFinished);
      await this.investmentRepository.saveInvestmentInvestor(
        investmentInvestor,
        ctx,
      );

      const investment = await this.investmentRepository.findById(
        input.investmentId,
        ctx,
      );
      if (!investment) {
        throw new InvestmentNotFoundException(input.investmentId);
      }
      await syncInvestmentFinished(investment, this.investmentRepository, ctx);
    });
  }
}
