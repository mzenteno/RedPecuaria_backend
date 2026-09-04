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

export interface UserRepository {
  findById(id: string, ctx?: TransactionContext): Promise<User | null>;
  findByUsername(
    username: string,
    ctx?: TransactionContext,
  ): Promise<User | null>;
  findAllPaginated(
    params: ListUsersParams,
    ctx?: TransactionContext,
  ): Promise<PaginatedResult<User>>;
  save(user: User, ctx?: TransactionContext): Promise<User>;
}
