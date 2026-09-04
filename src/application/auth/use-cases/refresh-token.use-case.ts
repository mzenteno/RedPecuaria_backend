import { Inject, Injectable } from '@nestjs/common';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@domain/auth/repositories/refresh-token.repository';
import { RefreshToken } from '@domain/auth/entities/refresh-token';
import { InvalidRefreshTokenException } from '@domain/auth/exceptions/invalid-refresh-token.exception';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { NoActiveUserCompanyException } from '@domain/auth/exceptions/no-active-user-company.exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';
import { HASH_SERVICE, type HashService } from '@domain/core/ports/hash.port';
import {
  TOKEN_GENERATOR,
  type TokenGenerator,
} from '@domain/core/ports/token-generator.port';

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

/**
 * Rota el refresh token en cada uso (ver docs/auth-sessions/auth-sessions.md):
 * el usado se revoca y se emite un par nuevo. Si el token recibido ya estaba
 * revocado, es indicio de robo/reuso — se revocan todas las sesiones activas
 * del usuario como medida de seguridad.
 */
@Injectable()
export class RefreshTokenUseCase {
  constructor(
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(input: RefreshTokenInput): Promise<RefreshTokenResult> {
    const tokenHash = this.hashService.sha256(input.refreshToken);
    const stored = await this.refreshTokenRepository.findByTokenHash(tokenHash);
    if (!stored) {
      throw new InvalidRefreshTokenException();
    }

    if (stored.isRevoked()) {
      const activeSessions =
        await this.refreshTokenRepository.findActiveByUserId(stored.userId);
      for (const session of activeSessions) {
        session.revoke();
        await this.refreshTokenRepository.save(session);
      }
      throw new InvalidRefreshTokenException();
    }

    if (stored.isExpired()) {
      throw new InvalidRefreshTokenException();
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      throw new UserNotFoundException(stored.userId);
    }
    const userType = await this.userTypeRepository.findById(user.userTypeId);
    const isSuperAdmin = userType?.isSuperAdmin() ?? false;

    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      stored.userId,
      stored.companyId,
    );
    let roleId: string | undefined;
    if (userCompany && !userCompany.isDeleted) {
      roleId = userCompany.roleId;
    } else if (isSuperAdmin) {
      // Un Super Administrador puede estar "activo" en una empresa donde no
      // tiene una fila en `user_companies` (ver `SwitchCompanyUseCase`) — el
      // refresh no debe cortarle la sesión por eso, solo confirmar que la
      // empresa sigue existiendo.
      const company = await this.companyRepository.findById(stored.companyId);
      if (!company || company.isDeleted) {
        throw new CompanyNotFoundException(stored.companyId);
      }
      roleId = undefined;
    } else {
      throw new NoActiveUserCompanyException();
    }

    stored.revoke();
    await this.refreshTokenRepository.save(stored);

    const accessToken = this.tokenGenerator.generateAccessToken({
      sub: user.id,
      companyId: stored.companyId,
      roleId,
      email: user.email.toString(),
      isSuperAdmin,
    });

    const newOpaqueToken = this.tokenGenerator.generateOpaqueToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

    const newRefreshToken = RefreshToken.create({
      userId: stored.userId,
      companyId: stored.companyId,
      tokenHash: this.hashService.sha256(newOpaqueToken),
      expiresAt,
    });
    await this.refreshTokenRepository.save(newRefreshToken);

    return { accessToken, refreshToken: newOpaqueToken };
  }
}
