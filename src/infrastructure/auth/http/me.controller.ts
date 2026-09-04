import { Controller, Get } from '@nestjs/common';
import { type AccessTokenPayload } from '@domain/core/ports/token-generator.port';
import { GetAuthorizedMenuUseCase } from '@application/auth/use-cases/get-authorized-menu.use-case';
import { CurrentUser } from '@infrastructure/common/http/current-user.decorator';
import { MenuResponseDto } from './dto/menu.response.dto';
import { MenuMapper } from './menu.mapper';

/**
 * Endpoints sobre el usuario autenticado. Sin `@Public()`, así que pasan por
 * `JwtAuthGuard` (global) — el `roleId` sale siempre de `@CurrentUser()`
 * (del token ya validado), nunca de un parámetro que mande el cliente.
 */
@Controller('me')
export class MeController {
  constructor(
    private readonly getAuthorizedMenuUseCase: GetAuthorizedMenuUseCase,
  ) {}

  @Get()
  getCurrentUser(@CurrentUser() user: AccessTokenPayload): AccessTokenPayload {
    return user;
  }

  @Get('menu')
  async getMenu(
    @CurrentUser('roleId') roleId: string | undefined,
    @CurrentUser('isSuperAdmin') isSuperAdmin: boolean,
  ): Promise<MenuResponseDto[]> {
    const items = await this.getAuthorizedMenuUseCase.execute({
      roleId,
      isSuperAdmin,
    });
    return items.map((item) => MenuMapper.toAuthorizedResponse(item));
  }
}
