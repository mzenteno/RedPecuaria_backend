# 2026-08-23 — Fase 1: migración inicial aplicada

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó la tabla `users` (email único, password_hash, full_name, is_active, last_login_at,
created_at) vía la migración `src/migrations/1787534864457-InitialSchema.ts`, corrida y
verificada contra la base `RedPecuaria`.

## Motivo

Fase 1 del plan de implementación del módulo `auth`: dejar el esquema de base de datos listo
antes de construir el dominio y los casos de uso.

## Qué había antes

La tabla no existía.
