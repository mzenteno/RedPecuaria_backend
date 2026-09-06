import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type UserRepository,
} from '@domain/user/repositories/user.repository';
import {
  USER_TYPE_REPOSITORY,
  type UserTypeRepository,
} from '@domain/user/repositories/user-type.repository';
import { InvalidCredentialsException } from '@domain/auth/exceptions/invalid-credentials.exception';
import {
  USER_COMPANY_REPOSITORY,
  type UserCompanyRepository,
} from '@domain/auth/repositories/user-company.repository';
import { NoActiveUserCompanyException } from '@domain/auth/exceptions/no-active-user-company.exception';
import {
  CompanySelectionRequiredException,
  type CompanyChoice,
} from '@domain/auth/exceptions/company-selection-required.exception';
import {
  COMPANY_REPOSITORY,
  type CompanyRepository,
} from '@domain/company/repositories/company.repository';
import {
  REFRESH_TOKEN_REPOSITORY,
  type RefreshTokenRepository,
} from '@domain/auth/repositories/refresh-token.repository';
import { RefreshToken } from '@domain/auth/entities/refresh-token';
import {
  PASSWORD_HASHER,
  type PasswordHasher,
} from '@domain/core/ports/password-hasher.port';
import { HASH_SERVICE, type HashService } from '@domain/core/ports/hash.port';
import {
  TOKEN_GENERATOR,
  type TokenGenerator,
} from '@domain/core/ports/token-generator.port';

export interface LoginInput {
  username: string;
  password: string;
  /** Solo necesario si el usuario tiene más de una empresa activa. */
  companyId?: string;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  userId: string;
  companyId: string;
  roleId: string;
}

const REFRESH_TOKEN_EXPIRES_IN_DAYS = 30;

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepository: UserRepository,
    @Inject(USER_TYPE_REPOSITORY)
    private readonly userTypeRepository: UserTypeRepository,
    @Inject(USER_COMPANY_REPOSITORY)
    private readonly userCompanyRepository: UserCompanyRepository,
    @Inject(COMPANY_REPOSITORY)
    private readonly companyRepository: CompanyRepository,
    @Inject(REFRESH_TOKEN_REPOSITORY)
    private readonly refreshTokenRepository: RefreshTokenRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(HASH_SERVICE) private readonly hashService: HashService,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
  ) {}

  async execute(input: LoginInput): Promise<LoginResult> {
    const user = await this.userRepository.findByUsername(input.username);
    if (!user || user.isDeleted) {
      throw new InvalidCredentialsException();
    }

    const passwordMatches = await this.passwordHasher.compare(
      input.password,
      user.passwordHash,
    );
    if (!passwordMatches) {
      throw new InvalidCredentialsException();
    }

    const activeUserCompanies =
      await this.userCompanyRepository.findActiveByUserId(user.id);
    if (activeUserCompanies.length === 0) {
      throw new NoActiveUserCompanyException();
    }

    let userCompany = activeUserCompanies[0];
    if (activeUserCompanies.length > 1) {
      if (!input.companyId) {
        const choices: CompanyChoice[] = await Promise.all(
          activeUserCompanies.map(async (uc) => {
            const company = await this.companyRepository.findById(uc.companyId);
            return {
              companyId: uc.companyId,
              companyName: company?.name ?? uc.companyId,
            };
          }),
        );
        throw new CompanySelectionRequiredException(choices);
      }

      const chosen = activeUserCompanies.find(
        (uc) => uc.companyId === input.companyId,
      );
      if (!chosen) {
        throw new NoActiveUserCompanyException();
      }
      userCompany = chosen;
    }

    const userType = await this.userTypeRepository.findById(user.userTypeId);

    const accessToken = this.tokenGenerator.generateAccessToken({
      sub: user.id,
      companyId: userCompany.companyId,
      roleId: userCompany.roleId,
      email: user.email.toString(),
      username: user.username,
      fullName: user.fullName,
      isSuperAdmin: userType?.isSuperAdmin() ?? false,
      isInvestor: userType?.isInvestor() ?? false,
    });

    const opaqueRefreshToken = this.tokenGenerator.generateOpaqueToken();
    const refreshTokenHash = this.hashService.sha256(opaqueRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_IN_DAYS);

    const refreshToken = RefreshToken.create({
      userId: user.id,
      companyId: userCompany.companyId,
      tokenHash: refreshTokenHash,
      expiresAt,
    });
    await this.refreshTokenRepository.save(refreshToken);

    user.recordLogin();
    await this.userRepository.save(user);

    return {
      accessToken,
      refreshToken: opaqueRefreshToken,
      userId: user.id,
      companyId: userCompany.companyId,
      roleId: userCompany.roleId,
    };
  }
}
