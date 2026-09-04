# 2026-08-31 — Fase 8: login, refresh y logout

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se completó el dominio de `auth-sessions`: entidad `RefreshToken`, puerto
`RefreshTokenRepository`, y las excepciones `InvalidCredentialsException`,
`InvalidRefreshTokenException`, `CompanySelectionRequiredException`. Se agregó el puerto
`TokenGenerator` (`domain/core/ports/token-generator.port.ts`) con su implementación
`JwtTokenGeneratorAdapter` (usa `@nestjs/jwt`), registrada en `core.module.ts` junto con
`JwtModule.registerAsync` (lee `JWT_ACCESS_SECRET`/`JWT_ACCESS_EXPIRES_IN_SECONDS` del
`.env`). Se agregaron `LoginUseCase`, `RefreshTokenUseCase`, `LogoutUseCase` en
`application/auth/use-cases/`, y el primer controlador HTTP del proyecto:
`AuthSessionsController` (`POST /auth/login`, `/auth/refresh`, `/auth/logout`), con sus DTOs
validados por `class-validator`. Fue necesario agregar el `ValidationPipe` global en
`main.ts` — no existía, y sin él los DTOs no se validaban en runtime. Sin tests unitarios
todavía (a pedido explícito). De paso se corrió `eslint --fix` sobre todo `src/` para limpiar
deuda de formato acumulada de rondas anteriores (solo formato, sin cambios de lógica).

## Motivo

Fase 8 del plan de `auth-sessions` — desbloquea, en la Fase 9, poder proteger con un guard
todos los controladores que quedaron pendientes en `role`, `company`, `user`, `menu`,
`permission` y `user-company`.

## Qué había antes

Solo existía la migración de la tabla `refresh_tokens` (Fase 1) y las variables de entorno de
JWT en `.env.example`, sin ningún código de dominio, aplicación ni infraestructura.
