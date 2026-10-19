import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import { KardexEntry } from '../entities/kardex-entry';

export const KARDEX_ENTRY_REPOSITORY = Symbol('KardexEntryRepository');

export interface FindKardexEntriesParams extends PaginationParams {
  investmentId: string;
  /** El Kardex ahora SIEMPRE se pide acotado a un inversionista puntual (a
   * pedido del usuario, 2026-10-14) — todas las filas (no solo "venta") se
   * filtran a las de este inversionista, y el saldo corrido se calcula ya
   * acotado a él. Ver `ListKardexEntriesByInvestmentUseCase` para el chequeo
   * de que un Inversionista solo puede pedir su propio `investorUserId`. */
  investorUserId: string;
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
   * de este cambio). `investorName` solo es `null` en movimientos
   * históricos sin inversionista (ver `assertKardexInvestor`). */
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
  /** Para la regla "la primera transacción de un inversionista en una
   * inversión siempre es ingreso" (ver `CreateKardexEntryUseCase`) — por
   * INVERSIONISTA, no por inversión completa (desde 2026-10-14 cada
   * inversionista tiene su propio saldo corrido, ver `InvestmentInvestor`):
   * un inversionista nuevo en una inversión con historial ajeno también
   * tiene que arrancar con un ingreso propio. Solo necesita saber si ya
   * existe alguna fila activa de ESE inversionista, no traerlas. */
  hasAnyActiveEntry(
    investmentId: string,
    investorUserId: string,
    ctx?: TransactionContext,
  ): Promise<boolean>;
  save(entry: KardexEntry, ctx?: TransactionContext): Promise<KardexEntry>;
}
