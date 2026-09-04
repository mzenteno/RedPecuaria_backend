# 2026-08-23 — Fase 1: migración inicial aplicada

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó la tabla `refresh_tokens` (user_id FK, company_id FK, token_hash único, expires_at,
revoked_at, created_at) vía la migración `src/migrations/1787534864457-InitialSchema.ts`,
corrida y verificada contra la base `RedPecuaria`.

## Motivo

Fase 1 del plan de implementación del módulo `auth`.

## Qué había antes

La tabla no existía.
