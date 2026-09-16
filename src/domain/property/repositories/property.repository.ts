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
  /** Activas de una empresa, SIN paginar — para poblar combos (Propiedad en
   * Inversiones/Kardex), que solo necesitan `id`+`name` de todas de una vez,
   * no una página (ver `PropertyOptionResponseDto`). Antes de esto, esos
   * combos reusaban `findAllPaginated` con `pageSize=100` (el tope del
   * endpoint paginado) — un problema real si una empresa pasa de 100
   * propiedades, ver el change de este cambio. */
  findOptionsByCompany(
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<Property[]>;
  save(property: Property, ctx?: TransactionContext): Promise<Property>;
}
