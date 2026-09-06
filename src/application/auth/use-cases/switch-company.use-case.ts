import { Inject, Injectable } from '@nestjs/common';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import { CompanyNotFoundException } from '@domain/company/exceptions/company-not-found.exception';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import { UserNotFoundException } from '@domain/user/exceptions/user-not-found.exception';
import { SuperAdminRequiredException } from '@domain/auth/exceptions/super-admin-required.exception';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@domain/auth/repositories/refresh-token.repository';
import { RefreshToken } from '@domain/auth/entities/refresh-token';
import { HASH_SERVICE, type HashService } from '@domain/core/ports/hash.port';
import {
  TOKEN_GENERATOR,
  type TokenGenerator,
} from '@domain/core/ports/token-generator.port';

export interface SwitchCompanyInput {
  userId: string;
  /** Sale del token ya validado (`@CurrentUser('isSuperAdmin')`), no se
   * vuelve a consultar `UserType` — mismo criterio que `ListCompaniesUseCase`. */
  isSuperAdmin: boolean;
  companyId: string;
}

export interface SwitchCompanyResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  companyId: string;
  roleId?: string;
}

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

/**
 * Le permite a un Super Administrador cambiar la "empresa activa" de su
 * sesión sin volver a loguearse — a diferencia del selector de empresa del
 * login (que solo ofrece las empresas donde el usuario tiene una fila en
 * `user_companies`), acá puede elegir **cualquier** empresa del sistema
 * (`ListCompaniesUseCase` ya le muestra todas). Si no tiene una fila propia
 * en la empresa elegida, el token queda sin `roleId` — no le hace falta,
 * ver `AccessTokenPayload.roleId`.
 */
@Injectable()
export class SwitchCompanyUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(input: SwitchCompanyInput): Promise<SwitchCompanyResult> {
    if (!input.isSuperAdmin) {
      throw new SuperAdminRequiredException();
    }

    const company = await this.companyRepository.findById(input.companyId);
    if (!company || company.isDeleted) {
      throw new CompanyNotFoundException(input.companyId);
    }

    const user = await this.userRepository.findById(input.userId);
    if (!user) {
      throw new UserNotFoundException(input.userId);
    }

    const userCompany = await this.userCompanyRepository.findByUserAndCompany(
      input.userId,
      input.companyId,
    );
    const roleId =
      userCompany && !userCompany.isDeleted ? userCompany.roleId : undefined;

    const accessToken = this.tokenGenerator.generateAccessToken({
      sub: user.id,
      companyId: company.id,
      roleId,
      email: user.email.toString(),
      username: user.username,
      fullName: user.fullName,
      isSuperAdmin: true,
      // Fijo en `false`: el guard de arriba ya exige `isSuperAdmin`, y todo
      // usuario tiene exactamente un `UserType` (ver
      // `docs/user-type/user-type.md`) — quien llega hasta acá no puede ser
      // también Inversionista, no hace falta volver a consultar `UserType`.
      isInvestor: false,
    });

    const opaqueRefreshToken = this.tokenGenerator.generateOpaqueToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      companyId: company.id,
      tokenHash: this.hashService.sha256(opaqueRefreshToken),
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    return {
      accessToken,
      refreshToken: opaqueRefreshToken,
      userId: user.id,
      companyId: company.id,
      roleId,
    };
  }
}
