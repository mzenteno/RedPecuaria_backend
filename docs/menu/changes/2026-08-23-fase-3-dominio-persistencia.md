# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/menu/`: entidad `Menu` (jerárquica), puerto `MenuRepository`, y el adaptador
TypeORM, conectado en `app.module.ts` vía `MenuModule`. Verificado listando los 5 menús
activos sembrados (padre + 4 hijos), en el orden correcto.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `menus` y sus 5 filas sembradas; no había ninguna clase de dominio ni
repositorio.
