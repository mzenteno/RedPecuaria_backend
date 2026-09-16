/** Forma liviana para los listados (`GET /investments`, `/by-gestion`,
 * `/by-property`, `/by-investor`, `/mine`) — a propósito SIN
 * `balanceQuantity`/`balanceKilos`/`total`: la grilla de Inversiones
 * (`investment-table.tsx`) no los muestra (ver el change de este cambio).
 * `InvestmentResponseDto` (con esos 3 campos) sigue existiendo para
 * alta/edición/detalle (`GET /investments/:id`), que sí los necesitan (ej.
 * "Saldo actual" en Kardex). Mismo criterio que `UserListItemResponseDto`.
 *
 * `propertyName` viene resuelto con JOIN, no con un fetch aparte del
 * catálogo de propiedades (bug real, ver el change de este cambio).
 * `propertyId` se mantiene (a diferencia de `userTypeId` en el listado de
 * usuarios) porque el atajo "Ver kardex" sí lo necesita crudo. */
export class InvestmentListItemResponseDto {
  id: string;
  propertyId: string;
  propertyName: string;
  gestion: number;
  description: string;
  isFinished: boolean;
  createdAt: Date;
  investorIds: string[];
}
