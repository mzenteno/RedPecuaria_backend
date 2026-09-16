import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { MovementType } from '../entities/movement-type';

export const MOVEMENT_TYPE_REPOSITORY = Symbol('MovementTypeRepository');

export interface MovementTypeRepository {
  findById(id: string, ctx?: TransactionContext): Promise<MovementType | null>;
  findAll(ctx?: TransactionContext): Promise<MovementType[]>;
  save(
    movementType: MovementType,
    ctx?: TransactionContext,
  ): Promise<MovementType>;
}
