# 2026-08-23 — Fase 1: migración inicial aplicada

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó la tabla `role_menu_permissions` (role_id FK, menu_id FK, can_view, can_create,
can_edit, can_delete, is_active, created_at; único por `(role_id, menu_id)`) vía la migración
`src/migrations/1787534864457-InitialSchema.ts`, corrida y verificada contra la base
`RedPecuaria`.

## Motivo

Fase 1 del plan de implementación del módulo `auth`.

## Qué había antes

La tabla no existía.
