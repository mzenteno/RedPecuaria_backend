import { KardexEntryResponseDto } from './kardex-entry.response.dto';

/** Solo para `GET /kardex-entries` (el listado) — agrega el saldo corrido
 * (cantidad/kilos) después de este movimiento, calculado al leer (ver
 * `KardexEntryWithRunningBalance` del dominio). `POST`/`PATCH` siguen
 * devolviendo `KardexEntryResponseDto` a secas: crear/editar una fila no
 * necesita su posición en el historial. */
export class KardexEntryListItemResponseDto extends KardexEntryResponseDto {
  runningBalanceQuantity: number;
  runningBalanceKilos: number;
}
