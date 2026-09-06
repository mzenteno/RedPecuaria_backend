import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import { Investment } from '../entities/investment';

export const INVESTMENT_REPOSITORY = Symbol('InvestmentRepository');

export interface FindInvestmentsByInvestorParams extends PaginationParams {
  investorUserId: string;
  companyId: string;
  /** Filtro opcional — solo lo usa `GET /investments/by-investor` (la
   * pantalla de Inversiones); `GET /investments/mine` (Kardex) nunca lo
   * manda. */
  propertyId?: string;
}

export interface FindInvestmentsByGestionParams extends PaginationParams {
  gestion: number;
  companyId: string;
  propertyId?: string;
  investorUserId?: string;
}

export interface FindInvestmentsByPropertyParams extends PaginationParams {
  propertyId: string;
  companyId: string;
  gestion?: number;
  investorUserId?: string;
}

export interface InvestmentRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Investment | null>;
  findActiveByProperty(
    propertyId: string,
    ctx?: TransactionContext,
  ): Promise<Investment[]>;
  /** Inversiones activas donde `investorUserId` es inversionista, de una
   * empresa puntual (a través de la cadena `Investment → Property →
   * Company`), paginado — usado tanto por "Mis inversiones" (Kardex,
   * `investorUserId` siempre de la sesión) como por buscar-por-inversionista
   * (Inversiones, `investorUserId` explícito). */
  findByInvestor(
    params: FindInvestmentsByInvestorParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>>;
  /** Inversiones activas de una gestión puntual, de cualquier propiedad de
   * la empresa, paginado — para la pantalla de Inversiones, que elige
   * "Gestión" primero (`propertyId`/`investorUserId` quedan como filtros
   * opcionales adicionales, resueltos en el servidor, no del lado del
   * cliente — con paginación real, filtrar solo la página ya traída daría
   * un resultado incompleto). */
  findActiveByCompanyAndGestion(
    params: FindInvestmentsByGestionParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>>;
  /** Inversiones activas de una propiedad puntual, paginado — para la
   * pantalla de Inversiones, cuando "Propiedad" es el único filtro elegido
   * (ni "Gestión" ni "Inversionista"). Distinto de `findActiveByProperty`
   * (sin paginar, usado por el atajo "Ver kardex" — se deja sin tocar).
   * `gestion`/`investorUserId` quedan como filtros opcionales adicionales,
   * mismo criterio que los otros dos métodos "by-*". */
  findActiveByPropertyPaginated(
    params: FindInvestmentsByPropertyParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Investment>>;
  save(investment: Investment, ctx?: TransactionContext): Promise<Investment>;
  /** Ids de los usuarios inversionistas de una inversión. */
  findInvestorIds(
    investmentId: string,
    ctx?: TransactionContext,
  ): Promise<string[]>;
  /** Reemplaza el conjunto completo de inversionistas (borra los que no
   * estén en la lista nueva, agrega los que falten) — no hay "editar
   * aporte" todavía, es solo la lista de quiénes participan. */
  replaceInvestors(
    investmentId: string,
    userIds: string[],
    ctx?: TransactionContext,
  ): Promise<void>;
}
