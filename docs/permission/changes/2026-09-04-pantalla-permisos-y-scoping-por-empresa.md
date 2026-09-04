# 2026-09-04 — Pantalla de Permisos + roles ajenos ya no se pueden tocar

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- `UpdateRoleUseCase`, `DeactivateRoleUseCase`, `SetRoleMenuPermissionUseCase` y
  `ListPermissionsByRoleUseCase` ahora reciben `companyId` (de
  `@CurrentUser('companyId')`) y validan que el rol pertenezca a esa empresa —
  antes ninguno de los cuatro lo validaba, así que cualquiera con sesión podía
  editar, desactivar, o leer/pisar los permisos de un rol de **otra** empresa
  con solo adivinar su id numérico. Devuelven `RoleNotFoundException` (404),
  no un 403 — no hay que confirmarle a quien pregunta que el rol existe en
  otra empresa.
- `GET /menus` (nuevo, `MenuController`) — catálogo plano de menús activos
  (`MenuCatalogResponseDto`: id/key/label/icon/path/parentId/order, sin
  `can*`). `ListActiveMenusUseCase` ya existía como caso de uso pero nunca
  se había conectado a ningún controlador.
- Migración `AddPermissionsMenuPath` — el ítem "Permisos" del sidebar ya es
  un link real (`/permissions`).
- Pantalla `app/(main)/permissions` (frontend) — selector de rol + grilla de
  permisos por menú, con guardado optimista por casilla (`PUT`, sin botón
  "Guardar" aparte).

## Motivo

Se encontró el hueco al construir la pantalla de Permisos: iba a heredar
exactamente el mismo problema que ya se había cerrado en Usuarios y en el
resto de Roles (`create`/`update`/`list` de `RoleController`) — no tenía
sentido dejar `update`/`deactivate`/permisos sin la misma corrección justo
cuando se estaba completando el módulo de `auth`.

## Qué había antes

`PATCH /roles/:id`, `PATCH /roles/:id/deactivate`, `PUT
/roles/:roleId/menus/:menuId/permissions` y `GET /roles/:roleId/permissions`
solo validaban que el rol existiera, nunca que perteneciera a la empresa de
quien hacía la petición. No existía pantalla de Permisos en el frontend, ni
un endpoint para listar el catálogo de menús fuera de `GET /me/menu`.
