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
  /** `Investment.investmentTypeId` resuelto a `isDinero()` — decide si una
   * Baja tiene "Haber" o no: en modo "kilo", `avgWeight` de una Baja es
   * merma en KILOS (no hay ningún dato de dinero cargado en esa fila, ver
   * `KardexEntryDialog`), así que su Haber da 0. En modo "dinero",
   * `avgWeight` de una Baja SÍ es el monto en Bs. que salió, y cuenta como
   * Haber (Baja es una salida de dinero, igual que Venta) — ver
   * `docs/investment/changes/2026-09-26-baja-en-el-haber.md`. */
  investmentTypeIsDinero: boolean;
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
  /** Equivalente a `runningBalanceKilos`, pero en dinero — mismo signo que
   * `computeMovementDelta` en modo "dinero" (Ingreso suma, Venta resta). Se
   * calcula siempre igual, sin importar el tipo de la inversión (la query
   * ya está acotada a una sola inversión) — el frontend decide cuál de los
   * dos mostrar según `Investment.investmentTypeName`. */
  runningBalanceTotal: number;
  /** Nombre del tipo de movimiento y del inversionista, resueltos con JOIN
   * en la misma consulta — nunca con un segundo fetch aparte cruzado a mano
   * del lado del cliente (mismo criterio que `UserWithType`, ver el change
   * de este cambio). `investorName` es `null` salvo en "venta". */
  movementTypeName: string;
  investorName: string | null;
  /** Reformulación contable de esta fila — Ingreso es "Debe", Venta/Baja
   * son "Haber" (Baja solo si `investmentTypeIsDinero`, ver
   * `FindKardexEntriesParams`). Resueltos acá, no en el mapper HTTP, porque
   * ya necesitan `investmentTypeIsDinero` (que el mapper no tiene) para
   * decidir si una Baja cuenta o no. */
  debe: number;
  haber: number;
}

/** El listado paginado de siempre (`PaginatedResult`) más los totales de
 * Debe/Haber de TODO el historial activo de la inversión (no solo la
 * página) — para el footer de la tabla en el frontend, que necesita sumar
 * sobre el total, no sobre lo que se ve en pantalla. No se extiende
 * `PaginatedResult<T>` con esto a propósito: ese tipo es compartido por
 * cualquier listado paginado de la app (Usuarios, Propiedades, etc.), que
 * no necesitan estos 2 campos. */
export interface KardexEntriesPage extends PaginatedResult<KardexEntryWithRunningBalance> {
  totalDebe: number;
  totalHaber: number;
}

export interface KardexEntryRepository {
  findById(id: string, ctx?: TransactionContext): Promise<KardexEntry | null>;
  /** Paginado en el servidor — ver ARCHITECTURE.md §8/§9 del frontend: todo
   * listado pagina en el servidor salvo Empresas/Roles/Permisos. */
  findActiveByInvestment(
    params: FindKardexEntriesParams,
    ctx?: TransactionContext,
  ): Promise<KardexEntriesPage>;
  /** Para la regla "la primera transacción de una inversión siempre es
   * ingreso" (ver `CreateKardexEntryUseCase`) — solo necesita saber si ya
   * existe alguna fila activa, no traerlas. */
  hasAnyActiveEntry(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<boolean>;
  save(entry: KardexEntry, ctx?: TransactionContext): Promise<KardexEntry>;
}
