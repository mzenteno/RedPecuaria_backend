# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/user-company/`: entidad `UserCompany`, puerto `UserCompanyRepository`,
excepciones `UserCompanyAlreadyExistsException` y `NoActiveUserCompanyException`, y el
adaptador TypeORM, conectado en `app.module.ts` vía `UserCompanyModule`. Verificado listando
los vínculos activos del usuario admin sembrado.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `user_companies` y el vínculo sembrado; no había ninguna clase de
dominio ni repositorio.
