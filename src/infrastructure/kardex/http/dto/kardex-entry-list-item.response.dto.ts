/** Forma liviana para el listado (`GET /kardex-entries`) — a propósito NO
 * `extends KardexEntryResponseDto`: la tabla de Kardex (`kardex-table.tsx`)
 * no muestra `total` a secas (se sacó de la pantalla, sigue solo en el
 * diálogo de alta/edición), ni `investmentId`/`createdAt` (el listado ya
 * está acotado a una sola inversión, y no hay columna de fecha de
 * creación). `movementTypeId`/`investorUserId` (los FK crudos) tampoco
 * viajan acá — en su lugar, `movementTypeName`/`investorName` ya vienen
 * resueltos con JOIN en la misma consulta (ver `KardexEntryWithRunningBalance`
 * del dominio): el frontend no necesita pedir el catálogo de tipos ni la
 * lista de inversionistas aparte solo para pintar esta tabla (bug real, ver
 * el change de este cambio). Agrega también el saldo corrido (cantidad/
 * kilos) después de este movimiento, calculado al leer.
 *
 * `debe`/`haber`: reformulación contable del movimiento — Ingreso es
 * "Debe" (dinero que entra, lo invertido), Venta/Baja son "Haber" (dinero
 * que sale/se recupera). Baja solo tiene Haber si la inversión es "por
 * dinero" (en "por kilo" no hay ningún dato de plata cargado en una Baja,
 * ver `KardexEntryDialog`) — resueltos en el REPOSITORIO, no en el mapper
 * HTTP, porque hace falta `Investment.investmentTypeId` para decidir eso
 * (ver `FindKardexEntriesParams.investmentTypeIsDinero` del dominio y
 * `docs/investment/changes/2026-09-26-baja-en-el-haber.md`). El mapper
 * solo pasa estos dos campos tal cual llegan.
 *
 * `POST`/`PATCH`/`GET /:id` siguen devolviendo `KardexEntryResponseDto`
 * completo (con los FK crudos y `total`) — crear/editar/el diálogo sí los
 * necesitan. Mismo criterio que `UserListItemResponseDto` (`userTypeName`
 * en vez de `userTypeId`). */
export class KardexEntryListItemResponseDto {
  id: string;
  entryDate: string;
  detail: string;
  movementTypeName: string;
  investorName: string | null;
  avgWeight: number;
  entryQuantity: number;
  entryKilos: number;
  exitQuantity: number;
  exitKilos: number;
  runningBalanceQuantity: number;
  runningBalanceKilos: number;
  /** Equivalente a `runningBalanceKilos` en dinero — solo tiene sentido
   * mostrarlo si la inversión es "por dinero" (ver
   * `Investment.investmentTypeName`); en "por kilo" el frontend ignora
   * este campo. */
  runningBalanceTotal: number;
  debe: number;
  haber: number;
}
