# 2026-09-02 — Fase 9: guard global de autenticación

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `JwtAuthGuard` (`infrastructure/core/security/jwt-auth.guard.ts`), registrado
globalmente vía `APP_GUARD` en `core.module.ts` — protege por defecto **toda** ruta nueva del
proyecto, sin tener que acordarse de agregarle nada. Valida el access token del header
`Authorization: Bearer <token>` con `TokenGenerator.verifyAccessToken()` (ya existía desde
Fase 8) y, si es válido, deja el payload decodificado en `request.user`.

Se agregaron dos piezas de apoyo:
- `@Public()` (`infrastructure/common/http/public.decorator.ts`) — decorador + metadata que el
  guard consulta (`Reflector`) para saltarse la validación en rutas que no la necesitan. Se
  aplicó a `login`/`refresh`/`logout` de `AuthSessionsController` (operan sobre el refresh
  token opaco o son las que emiten el access token, no dependen de uno vigente).
- `@CurrentUser()` (`infrastructure/common/http/current-user.decorator.ts`) — lee
  `request.user` sin que el controlador toque `Request` de Express directo.

Se agregó `MeController` (`GET /me`) — primer endpoint protegido del proyecto, devuelve el
payload del token actual. Existe únicamente para verificar el guard de punta a punta.

Verificado contra la app real: sin token → 401 (`Falta el token de autenticación`); token
inventado → 401 (`Token inválido o expirado`); token real del login → 200 con el payload; las
tres rutas públicas (`login`, `refresh`, `logout`) siguen funcionando sin token.

## Motivo

Necesario para poder exponer con seguridad el próximo endpoint (`GET /me/menu`, que arma el
menú de navegación a partir del `roleId` del usuario autenticado) — sin el guard, ese `roleId`
tendría que venir de un parámetro que el cliente controla, lo cual no es confiable.

## Qué había antes

No existía ningún mecanismo de autorización — todos los casos de uso de CRUD (`role`,
`company`, `user`, `permission`, `user-company`) estaban implementados pero sin ningún
controlador HTTP, precisamente porque no había forma segura de protegerlos.
