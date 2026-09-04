# 2026-08-31 — Fase 7: casos de uso de asignación de permisos

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregaron `SetRoleMenuPermissionUseCase` (upsert: crea el permiso si el par
`(roleId, menuId)` no existe, o lo actualiza si ya existe) y `ListPermissionsByRoleUseCase` en
`application/auth/use-cases/`. Fue necesario agregar `MenuNotFoundException` a
`domain/auth/exceptions/` — no existía. Registrados en `auth.module.ts`. Sin tests unitarios
todavía (a pedido explícito).

## Motivo

Fase 7 del plan de `permission` (CRUD de asignación), modelado como upsert porque en el
lenguaje de negocio "asignar permisos" no distingue la primera vez de una corrección.

## Qué había antes

Solo existía el dominio y la persistencia de `RoleMenuPermission` (Fase 3), sin ningún caso de
uso.
