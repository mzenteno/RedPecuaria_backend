import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { UserType } from '../entities/user-type';

export const USER_TYPE_REPOSITORY = Symbol('UserTypeRepository');

export interface UserTypeRepository {
  findById(id: string, ctx?: TransactionContext): Promise<UserType | null>;
  findAll(ctx?: TransactionContext): Promise<UserType[]>;
  save(userType: UserType, ctx?: TransactionContext): Promise<UserType>;
}
