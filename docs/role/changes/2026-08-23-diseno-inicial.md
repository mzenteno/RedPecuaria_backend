# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `Role` como entidad **propia de cada empresa** (no un enum global fijo). Cada
empresa crea y nombra sus propios roles, y estos son la base para asignar permisos por menú.

## Motivo

Inicialmente se planteó `Role` como un enum fijo (`ADMIN` / `INVESTOR`) compartido por todo
el sistema. Se descartó esa idea porque no permitía que cada empresa definiera roles propios
(ej. "Contador", "Auditor") sin tocar código — inconsistente con que los permisos ya son
configurables en base de datos.

## Qué había antes

Se había considerado `Role` como un enum de TypeScript (`ADMIN | INVESTOR`), sin tabla propia,
almacenado como columna string en `user_companies`. Se reemplazó por esta entidad antes de
llegar a implementarse.
