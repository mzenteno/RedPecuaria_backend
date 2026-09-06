import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import { KardexEntry } from '../entities/kardex-entry';

export const KARDEX_ENTRY_REPOSITORY = Symbol('KardexEntryRepository');

export interface FindKardexEntriesParams extends PaginationParams {
  investmentId: string;
  /** Si viene, los movimientos "venta" se filtran a los que le corresponden
   * a este inversionista puntual — "ingreso"/"baja" nunca se filtran (son
   * generales, sin inversionista, ver `docs/investment/investment.md`). Se
   * manda solo cuando quien pide el listado es de tipo Inversionista; un
   * Administrador/Super Administrador ve todas las ventas (sin este
   * parámetro). */
  restrictSalesToInvestorId?: string;
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
