# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/user-type/`: entidad `UserType`, puerto `UserTypeRepository`, excepción
`UserTypeNotFoundException`, y el adaptador TypeORM, conectado en `app.module.ts` vía
`UserTypeModule`. Verificado listando los 2 tipos sembrados.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `user_types` y sus 2 filas sembradas; no había ninguna clase de dominio
ni repositorio.
