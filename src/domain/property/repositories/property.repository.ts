import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginationParams,
  PaginatedResult,
} from '@domain/common/paginated-result';
import { Property } from '../entities/property';

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');

export interface FindPropertiesParams extends PaginationParams {
  companyId: string;
}

export interface PropertyRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Property | null>;
  findByCompanyAndName(
    companyId: string,
    name: string,
    ctx?: TransactionContext,
  ): Promise<Property | null>;
  /** Activas de una empresa, paginado en el servidor — ver ARCHITECTURE.md
   * §8/§9 del frontend: todo listado pagina en el servidor salvo
   * Empresas/Roles/Permisos, y "Propiedades" no es ninguno de esos 3. */
  findAllPaginated(
    params: FindPropertiesParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<Property>>;
  save(property: Property, ctx?: TransactionContext): Promise<Property>;
}
