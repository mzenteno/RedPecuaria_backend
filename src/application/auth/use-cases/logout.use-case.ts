import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@domain/auth/repositories/refresh-token.repository';
import { HASH_SERVICE, type HashService } from '@domain/core/ports/hash.port';

export interface LogoutInput {
  refreshToken: string;
}

/**
 * Idempotente a propósito: si el token ya no existe o ya estaba revocado, no
 * es un error — el efecto deseado (que esa sesión no sirva más) ya se
 * cumple.
 */
@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const tokenHash = this.hashService.sha256(input.refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!stored || stored.isRevoked()) {
      return;
    }

    stored.revoke();
    await this.refreshTokenRepository.save(stored);
  }
}
