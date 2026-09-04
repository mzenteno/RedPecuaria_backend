import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import {
  TOKEN_GENERATOR,
  type TokenGenerator,
  type AccessTokenPayload,
} from '@domain/core/ports/token-generator.port';
import { IS_PUBLIC_KEY } from '@infrastructure/common/http/public.decorator';

/** Request ya autenticada — `user` lo deja puesto este guard, nunca el cliente. */
export interface AuthenticatedRequest extends Request {
  user: AccessTokenPayload;
}

/**
 * Portero global: valida el access token (JWT) del header `Authorization` y,
 * si es válido, adjunta su payload ya verificado a `request.user` para que
 * `@CurrentUser()` y los controladores lo lean sin volver a validar nada.
 * No transforma la respuesta (eso lo hace `ResponseInterceptor`) — solo deja
 * pasar o rechaza. Rutas marcadas con `@Public()` se saltan esta validación
 * (login/refresh/logout: no tienen o no necesitan un access token vigente).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Falta el token de autenticación');
    }

    const payload = this.tokenGenerator.verifyAccessToken(token);
    if (!payload) {
      throw new UnauthorizedException('Token inválido o expirado');
    }

    request.user = payload;
    return true;
  }

  private extractToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header) {
      return null;
    }
    const [type, token] = header.split(' ');
    return type === 'Bearer' && token ? token : null;
  }
}
