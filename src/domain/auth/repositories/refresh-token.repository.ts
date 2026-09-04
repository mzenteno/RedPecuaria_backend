import { TransactionContext } from '@domain/core/ports/transaction-manager.port';
import { RefreshToken } from '../entities/refresh-token';

export const REFRESH_TOKEN_REPOSITORY = Symbol('RefreshTokenRepository');

export interface RefreshTokenRepository {
  findByTokenHash(
    tokenHash: string,
    ctx?: TransactionContext,
  ): Promise<RefreshToken | null>;
  /** Para revocar todas las sesiones de un usuario ante un indicio de robo (reuso detectado). */
  findActiveByUserId(
    userId: string,
    ctx?: TransactionContext,
  ): Promise<RefreshToken[]>;
  save(
    refreshToken: RefreshToken,
    ctx?: TransactionContext,
  ): Promise<RefreshToken>;
}
