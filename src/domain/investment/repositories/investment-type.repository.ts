import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { InvestmentType } from '../entities/investment-type';

export const INVESTMENT_TYPE_REPOSITORY = Symbol('InvestmentTypeRepository');

export interface InvestmentTypeRepository {
  findById(
    id: string,
    ctx?: TransactionContext,
  ): Promise<InvestmentType | null>;
  findAll(ctx?: TransactionContext): Promise<InvestmentType[]>;
}
