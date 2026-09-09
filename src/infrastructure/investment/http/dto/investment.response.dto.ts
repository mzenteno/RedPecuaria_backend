export class InvestmentResponseDto {
  id: string;
  propertyId: string;
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
  isDeleted: boolean;
  createdAt: Date;
  investorIds: string[];
}
