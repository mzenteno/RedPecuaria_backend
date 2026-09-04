# 2026-08-31 — Caso de uso de solo lectura

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `ListActiveMenusUseCase` en `application/auth/use-cases/`, que expone
`MenuRepository.findAllActive()`. No hay CRUD porque los menús se crean solo por
migración/seed (ver reglas de negocio arriba) — falta todavía el endpoint HTTP (Fase 7).

## Motivo

Primer paso de la Fase 7 (endpoint de lectura del catálogo de menús).

## Qué había antes

Solo existía el dominio y la persistencia de `Menu` (Fase 3), sin ningún caso de uso.
