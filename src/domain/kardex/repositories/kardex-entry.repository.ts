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

/** Saldo corrido (cantidad/kilos) después de este movimiento puntual —
 * calculado al leer (función de ventana SQL sobre todos los movimientos
 * activos de la inversión, antes de paginar), nunca guardado. Distinto del
 * saldo VIGENTE de la inversión (`Investment.balanceQuantity`/
 * `balanceKilos`, ver ese archivo): esto es el historial fila por fila,
 * solo para mostrar (mismo criterio que el Dashboard — no duplicar un dato
 * derivable). Únicamente lo devuelve `findActiveByInvestment` (el
 * listado); `findById`/`save` siguen trabajando con `KardexEntry` a secas. */
export interface KardexEntryWithRunningBalance {
  entry: KardexEntry;
  runningBalanceQuantity: number;
  runningBalanceKilos: number;
}

export interface KardexEntryRepository {
  findById(id: string, ctx?: TransactionContext): Promise<KardexEntry | null>;
  /** Paginado en el servidor — ver ARCHITECTURE.md §8/§9 del frontend: todo
   * listado pagina en el servidor salvo Empresas/Roles/Permisos. */
  findActiveByInvestment(
    params: FindKardexEntriesParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<KardexEntryWithRunningBalance>>;
  /** Para la regla "la primera transacción de una inversión siempre es
   * ingreso" (ver `CreateKardexEntryUseCase`) — solo necesita saber si ya
   * existe alguna fila activa, no traerlas. */
  hasAnyActiveEntry(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<boolean>;
  save(entry: KardexEntry, ctx?: TransactionContext): Promise<KardexEntry>;
}
