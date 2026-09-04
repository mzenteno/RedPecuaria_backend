# 2026-08-31 — Fase 4: casos de uso CRUD de empresas

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregaron `CreateCompanyUseCase`, `UpdateCompanyUseCase`, `DeactivateCompanyUseCase` y
`ListCompaniesUseCase` en `application/company/use-cases/`. Fue necesario agregar `findAll` a
`CompanyRepository` (puerto) y a su adaptador TypeORM — no existía ningún método para listar.
Registrados en `company.module.ts`. Sin tests unitarios todavía (a pedido explícito).

## Motivo

Fase 4 del plan de `company` (CRUD), siguiendo el mismo patrón ya usado en `role` (Fase 6).

## Qué había antes

Solo existía el dominio y la persistencia de `Company` (Fase 3): entidad, puerto con
`findById`/`save` únicamente, y el adaptador TypeORM, sin ningún caso de uso.
