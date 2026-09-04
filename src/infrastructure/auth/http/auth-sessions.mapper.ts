import { LoginResult } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenResult } from '@application/auth/use-cases/refresh-token.use-case';
import { SwitchCompanyResult } from '@application/auth/use-cases/switch-company.use-case';
import { LoginResponseDto } from './dto/login.response.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.response.dto';

export class AuthSessionsMapper {
  /** Misma forma de respuesta para login y switch-company (ambos emiten una
   * sesión nueva) — solo cambia si `roleId` viene presente. */
  static toLoginResponse(
    result: LoginResult | SwitchCompanyResult,
  ): LoginResponseDto {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      userId: result.userId,
      companyId: result.companyId,
      roleId: result.roleId,
    };
  }

  static toRefreshResponse(
    result: RefreshTokenResult,
  ): RefreshTokenResponseDto {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
  }
}
