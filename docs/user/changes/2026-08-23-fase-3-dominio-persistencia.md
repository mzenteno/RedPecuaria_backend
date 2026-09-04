# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/user/`: VO `Email`, entidad `User` (incluye `userTypeId`), puerto
`UserRepository`, excepciones `UserNotFoundException` y `EmailAlreadyRegisteredException`, y
el adaptador TypeORM, conectado en `app.module.ts` vía `UserModule`. Verificado buscando el
usuario admin sembrado por su email.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `users` (Fase 1) y la fila del admin sembrado (Fase 2); no había ninguna
clase de dominio ni repositorio.
