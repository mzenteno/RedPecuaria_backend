# 2026-08-23 — Fase 1: migración inicial aplicada

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó la tabla `user_companies` (user_id FK, company_id FK, role_id FK, is_active,
created_at; único por `(user_id, company_id)`; FK compuesta `(company_id, role_id) →
roles(company_id, id)`) vía la migración `src/migrations/1787534864457-InitialSchema.ts`,
corrida y verificada contra la base `RedPecuaria`.

## Motivo

Fase 1 del plan de implementación del módulo `auth`.

## Qué había antes

La tabla no existía.
