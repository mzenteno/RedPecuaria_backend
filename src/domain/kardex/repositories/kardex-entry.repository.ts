import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { KardexEntry } from '../entities/kardex-entry';

export const KARDEX_ENTRY_REPOSITORY = Symbol('KardexEntryRepository');

export interface KardexEntryRepository {
  findById(id: string, ctx?: TransactionContext): Promise<KardexEntry | null>;
  findActiveByInvestment(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<KardexEntry[]>;
  save(entry: KardexEntry, ctx?: TransactionContext): Promise<KardexEntry>;
}
