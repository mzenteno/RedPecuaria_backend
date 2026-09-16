import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import {
  PaginatedResult,
  PaginationParams,
} from '@domain/common/paginated-result';
import { User } from '../entities/user';

export const USER_REPOSITORY = Symbol('UserRepository');

/** `companyId`: un usuario puede pertenecer a varias empresas (`UserCompany`)
 * — el listado siempre está acotado a una, nunca "todas" (ver
 * `docs/user/user.md`: la "empresa activa" de la sesión, o la elegida por un
 * Super Administrador vía `SwitchCompanyUseCase`). */
export interface ListUsersParams extends PaginationParams {
  companyId: string;
}

export interface FindUserOptionsParams {
  companyId: string;
  /** Sin esto, todos los usuarios activos de la empresa — con esto, solo
   * los de ese tipo (ej. Inversionista, para el combo de `InvestmentDialog`,
   * ver el change de este cambio). */
  userTypeId?: string;
}

/** El nombre del tipo de usuario resuelto con JOIN en la misma consulta del
 * listado (`findAllPaginated`) — nunca con una consulta aparte por fila ni
 * dejado para que lo resuelva el cliente cruzando `GET /user-types` a mano
 * (bug real: así estaba antes, ver el change de este cambio). Mismo criterio
 * que `KardexEntryWithRunningBalance`: un tipo "con datos resueltos", solo
 * para lectura en listados, la entidad `User` de dominio no lo conoce. */
export interface UserWithType {
  user: User;
  userTypeName: string;
}

export interface UserRepository {
  findById(id: string, ctx?: TransactionContext): Promise<User | null>;
  findByUsername(
    username: string,
    ctx?: TransactionContext,
  ): Promise<User | null>;
  findAllPaginated(
    params: ListUsersParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<UserWithType>>;
  /** Activos de una empresa, SIN paginar, opcionalmente filtrados por tipo —
   * para combos (Inversionista en `InvestmentDialog`), que solo necesitan
   * `id`+`fullName` de todos de una vez (ver `UserOptionResponseDto`). Antes
   * de esto, `useInvestorUsers()` reusaba `findAllPaginated` con
   * `pageSize=100` y filtraba por tipo del lado del cliente — un problema
   * real si una empresa pasa de 100 usuarios, ver el change de este cambio. */
  findOptions(
    params: FindUserOptionsParams,
    ctx?: TransactionContext,
  ): Promise<User[]>;
  save(user: User, ctx?: TransactionContext): Promise<User>;
}
