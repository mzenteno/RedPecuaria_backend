export const DASHBOARD_REPOSITORY = Symbol('DashboardRepository');

/** Saldo actual de una inversión de la que el usuario logueado es
 * inversionista — la última fila del kardex de esa inversión (por
 * `entryDate`/`createdAt`), no un cálculo propio: "Fase 1" del Kardex no
 * deriva saldos de nada (ver `docs/investment/investment.md`), esto solo
 * lee la última fila ya cargada. */
export interface InvestorInvestmentSummary {
  investmentId: string;
  propertyName: string;
  gestion: number;
  description: string;
  currentBalanceQuantity: number;
  currentBalanceKilos: number;
}

/** "Mi perfil"/"Mi dashboard" de un Inversionista — ver
 * `docs/dashboard/dashboard.md` para qué significa (y qué NO significa)
 * cada número acá. */
export interface InvestorDashboardSummary {
  investmentsCount: number;
  /** `SUM(kardexEntry.total)` donde `movementType = 'venta'` Y
   * `investorUserId` es este usuario — el único número de dinero con
   * significado bien definido hoy (una "venta" ya se atribuye a un
   * inversionista puntual). No es "ganancia" ni "capital invertido": esos
   * cálculos no existen todavía (ver `docs/investment/investment.md`,
   * "Decisiones de alcance"). */
  totalSalesReceived: number;
  investments: InvestorInvestmentSummary[];
}

export interface TopInvestorSummary {
  userId: string;
  fullName: string;
  totalSalesReceived: number;
}

export interface RecentMovementSummary {
  id: string;
  entryDate: string;
  detail: string;
  movementType: string;
  total: number;
  propertyName: string;
  investmentDescription: string;
}

/** Dashboard de Administrador/Super Administrador — siempre acotado a la
 * empresa activa de la sesión (`companyId`), igual criterio que el resto de
 * la app: ni un Super Administrador ve acá números agregados de TODAS sus
 * empresas, ve los de la que tiene activa (ver `ListCompaniesUseCase` para
 * el único lugar donde sí ve todas, y no es este). */
export interface AdminDashboardSummary {
  propertiesCount: number;
  activeInvestmentsCount: number;
  /** Usuarios distintos que participan como inversionista en al menos una
   * inversión activa de la empresa (`COUNT(DISTINCT investorId)`). */
  investorsCount: number;
  /** Mismo criterio que `InvestorDashboardSummary.totalSalesReceived`, pero
   * agregado a toda la empresa en vez de a un usuario puntual. */
  totalSalesAmount: number;
  topInvestors: TopInvestorSummary[];
  recentMovements: RecentMovementSummary[];
}

export interface DashboardRepository {
  getInvestorSummary(
    companyId: string,
    userId: string,
  ): Promise<InvestorDashboardSummary>;
  getAdminSummary(companyId: string): Promise<AdminDashboardSummary>;
}
