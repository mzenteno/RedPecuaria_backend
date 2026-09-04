import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Role } from '../entities/role';

export const ROLE_REPOSITORY = Symbol('RoleRepository');

export interface RoleRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Role | null>;
  findByCompanyAndName(
    companyId: string,
    name: string,
    ctx?: TransactionContext,
  ): Promise<Role | null>;
  findActiveByCompany(
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<Role[]>;
  save(role: Role, ctx?: TransactionContext): Promise<Role>;
}
