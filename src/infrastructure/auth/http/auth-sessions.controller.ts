import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { LoginUseCase } from '@application/auth/use-cases/login.use-case';
import { RefreshTokenUseCase } from '@application/auth/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '@application/auth/use-cases/logout.use-case';
import { SwitchCompanyUseCase } from '@application/auth/use-cases/switch-company.use-case';
import { Public } from '@infrastructure/common/http/public.decorator';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { type AccessTokenPayload } from '@domain/core/ports/token-generator.port';
import { LoginRequestDto } from './dto/login.request.dto';
import { RefreshTokenRequestDto } from './dto/refresh-token.request.dto';
import { SwitchCompanyRequestDto } from './dto/switch-company.request.dto';
import { LoginResponseDto } from './dto/login.response.dto';
import { RefreshTokenResponseDto } from './dto/refresh-token.response.dto';
import { AuthSessionsMapper } from './auth-sessions.mapper';

/**
 * `login`/`refresh`/`logout` son públicos (`@Public()`, no pasan por
 * `JwtAuthGuard`): emiten el access token, o no dependen de uno vigente
 * (operan sobre el refresh token opaco). `switch-company` sí requiere sesión
 * vigente — no tiene sentido "cambiar de empresa" sin estar ya autenticado.
 */
@Controller('auth')
export class AuthSessionsController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly switchCompanyUseCase: SwitchCompanyUseCase,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginRequestDto): Promise<LoginResponseDto> {
    const result = await this.loginUseCase.execute(dto);
    return AuthSessionsMapper.toLoginResponse(result);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Body() dto: RefreshTokenRequestDto,
  ): Promise<RefreshTokenResponseDto> {
    const result = await this.refreshTokenUseCase.execute(dto);
    return AuthSessionsMapper.toRefreshResponse(result);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshTokenRequestDto): Promise<void> {
    await this.logoutUseCase.execute(dto);
  }

  @Post('switch-company')
  @HttpCode(HttpStatus.OK)
  async switchCompany(
    @CurrentUser() user: AccessTokenPayload,
    @Body() dto: SwitchCompanyRequestDto,
  ): Promise<LoginResponseDto> {
    const result = await this.switchCompanyUseCase.execute({
      userId: user.sub,
      isSuperAdmin: user.isSuperAdmin,
      companyId: dto.companyId,
    });
    return AuthSessionsMapper.toLoginResponse(result);
  }
}
