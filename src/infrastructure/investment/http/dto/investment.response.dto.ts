export class InvestmentResponseDto {
  id: string;
  propertyId: string;
  /** Resuelto con JOIN, no con un fetch aparte del catálogo de propiedades
   * (bug real, ver el change de este cambio) — `propertyId` se mantiene
   * porque `InvestmentDialog` (edición) sí lo necesita crudo para el
   * `<select>` de "Propiedad". */
  propertyName: string;
  gestion: number;
  description: string;
  /** Saldo vigente, mantenido en cada alta/edición/baja de un `KardexEntry`
   * — ver `Investment.applyBalanceDelta`. */
  balanceQuantity: number;
  balanceKilos: number;
  total: number;
  /** Estado de negocio (activa/terminada), elegido a mano por el usuario —
   * ver `Investment.update`. */
  isFinished: boolean;
  createdAt: Date;
  investorIds: string[];
}
