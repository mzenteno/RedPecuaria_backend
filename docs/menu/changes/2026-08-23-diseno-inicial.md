# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `Menu` como catálogo global y jerárquico de pantallas del sistema, con una `key`
estable que usará el sistema de permisos dinámicos.

## Motivo

El proyecto necesita menús de navegación y permisos configurables por rol sobre cada menú. Se
decidió que el catálogo de menús sea global (mismo para todas las empresas) y que lo que varía
por empresa sea la asignación de permisos (`RoleMenuPermission`), no el catálogo en sí.

## Qué había antes

N/A — es el diseño inicial de este concepto.
