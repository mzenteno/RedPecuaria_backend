import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Investment } from '../entities/investment';

export const INVESTMENT_REPOSITORY = Symbol('InvestmentRepository');

export interface InvestmentRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Investment | null>;
  findActiveByProperty(
    propertyId: string,
    ctx?: TransactionContext,
  ): Promise<Investment[]>;
  save(investment: Investment, ctx?: TransactionContext): Promise<Investment>;
  /** Ids de los usuarios inversionistas de una inversión. */
  findInvestorIds(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<string[]>;
  /** Reemplaza el conjunto completo de inversionistas (borra los que no
   * estén en la lista nueva, agrega los que falten) — no hay "editar
   * aporte" todavía, es solo la lista de quiénes participan. */
  replaceInvestors(
    investmentId: string,
    userIds: string[],
    ctx?: TransactionContext,
  ): Promise<void>;
}
