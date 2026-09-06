import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import { KardexEntry } from '../entities/kardex-entry';

export const KARDEX_ENTRY_REPOSITORY = Symbol('KardexEntryRepository');

export interface FindKardexEntriesParams extends PaginationParams {
  investmentId: string;
}

export interface KardexEntryRepository {
  findById(id: string, ctx?: TransactionContext): Promise<KardexEntry | null>;
  /** Paginado en el servidor — ver ARCHITECTURE.md §8/§9 del frontend: todo
   * listado pagina en el servidor salvo Empresas/Roles/Permisos. */
  findActiveByInvestment(
    params: FindKardexEntriesParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<KardexEntry>>;
  save(entry: KardexEntry, ctx?: TransactionContext): Promise<KardexEntry>;
}
