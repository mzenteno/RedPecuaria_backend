# 2026-08-23 — Diseño y migración inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó la tabla `user_types` (name único, is_active, created_at) y la columna
`users.user_type_id` (FK obligatoria) vía la migración nueva
`src/migrations/1787536781990-AddUserType.ts`. Se sembraron los 2 tipos ("Administrador",
"Inversionista") y se hizo backfill del usuario admin existente (Fase 2) como
"Administrador".

## Motivo

Se necesitaba una clasificación informativa del usuario (Administrador/Inversionista),
separada de `Role` — que sigue siendo el que controla permisos por menú, ahora dinámico y por
empresa. Se implementó como migración nueva (no editando `InitialSchema`/`SeedInitialData`),
a diferencia de la corrección anterior de ids, por decisión explícita de preservar el
historial de migraciones de forma aditiva de aquí en adelante.

## Qué había antes

`users` no tenía ninguna columna de clasificación; no existía `user_types`.
