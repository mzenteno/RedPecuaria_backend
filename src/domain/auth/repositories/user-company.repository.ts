import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { UserCompany } from '../entities/user-company';

export const USER_COMPANY_REPOSITORY = Symbol('UserCompanyRepository');

export interface UserCompanyRepository {
  findById(id: string, ctx?: TransactionContext): Promise<UserCompany | null>;
  findByUserAndCompany(
    userId: string,
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<UserCompany | null>;
  findActiveByUserId(
    userId: string,
    ctx?: TransactionContext,
  ): Promise<UserCompany[]>;
  save(
    userCompany: UserCompany,
    ctx?: TransactionContext,
  ): Promise<UserCompany>;
}
