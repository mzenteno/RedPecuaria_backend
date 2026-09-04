import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Company } from '../entities/company';

export const COMPANY_REPOSITORY = Symbol('CompanyRepository');

export interface CompanyRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Company | null>;
  /** Solo empresas activas — filtrado en la query, no en el caso de uso
   * (ver ARCHITECTURE.md §6.1: filtrar del lado del cliente/aplicación en
   * vez de en la query es exactamente lo que NO hay que hacer). */
  findAllActive(ctx?: TransactionContext): Promise<Company[]>;
  /** Devuelve la entidad persistida (con id asignado si era nueva). */
  save(company: Company, ctx?: TransactionContext): Promise<Company>;
}
