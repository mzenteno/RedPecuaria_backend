import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AccessTokenPayload } from '@domain/core/ports/token-generator.port';
import { AuthenticatedRequest } from '@infrastructure/core/security/jwt-auth.guard';

/**
 * Lee el payload que `JwtAuthGuard` ya validó y dejó en `request.user` — el
 * controlador nunca toca `Request` de Express directamente.
 * Uso: `@CurrentUser() user: AccessTokenPayload` o `@CurrentUser('roleId') roleId: string`.
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AccessTokenPayload | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return data ? request.user[data] : request.user;
  },
);
