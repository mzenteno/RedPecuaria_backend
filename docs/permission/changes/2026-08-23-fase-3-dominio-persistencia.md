# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/permission/`: entidad `RoleMenuPermission`, puerto
`RoleMenuPermissionRepository`, y el adaptador TypeORM, conectado en `app.module.ts` vía
`PermissionModule`. Verificado listando los 4 permisos del rol "Administrador" sembrados,
todos con `canView`/`canCreate` en `true`.

## Motivo

Fase 3 del plan de `auth`.

## Qué había antes

Solo existía la tabla `role_menu_permissions` y sus 4 filas sembradas; no había ninguna clase
de dominio ni repositorio.
