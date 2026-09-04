# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/role/`: entidad `Role`, puerto `RoleRepository`, excepciones
`RoleNotFoundException` y `RoleAlreadyExistsException`, y el adaptador TypeORM, conectado en
`app.module.ts` vía `RoleModule`. Verificado listando los roles activos de la empresa
sembrada.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `roles` y el rol "Administrador" sembrado; no había ninguna clase de
dominio ni repositorio.
