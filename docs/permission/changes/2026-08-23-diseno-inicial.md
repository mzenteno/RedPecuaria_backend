# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `RoleMenuPermission`: permisos granulares (ver/crear/editar/eliminar) de un rol
sobre un menú, configurables en base de datos.

## Motivo

Se pidió que los permisos por menú fueran configurables en BD (no fijos en código) y con
granularidad CRUD (no solo visibilidad). Al quedar los roles scoped a una empresa, el permiso
hereda ese scope sin necesitar su propia columna de empresa.

## Qué había antes

N/A — es el diseño inicial de este concepto.
