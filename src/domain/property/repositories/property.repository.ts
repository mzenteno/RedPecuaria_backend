import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { Property } from '../entities/property';

export const PROPERTY_REPOSITORY = Symbol('PropertyRepository');

export interface PropertyRepository {
  findById(id: string, ctx?: TransactionContext): Promise<Property | null>;
  findByCompanyAndName(
    companyId: string,
    name: string,
    ctx?: TransactionContext,
  ): Promise<Property | null>;
  findActiveByCompany(
    companyId: string,
    ctx?: TransactionContext,
  ): Promise<Property[]>;
  save(property: Property, ctx?: TransactionContext): Promise<Property>;
}
