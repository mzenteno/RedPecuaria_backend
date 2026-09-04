# 2026-08-23 — Fase 3: dominio y persistencia

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se creó `modules/company/`: entidad `Company` (id nulo hasta persistir, `create()`/
`fromPersistence()`/`toPersistence()`), puerto `CompanyRepository`, excepción
`CompanyNotFoundException`, y el adaptador TypeORM (`CompanyOrmEntity` +
`TypeOrmCompanyRepository`), conectado en `app.module.ts` vía `CompanyModule`. Verificado con
una consulta real contra la empresa sembrada en Fase 2.

## Motivo

Fase 3 del plan de `auth`: antes de tener casos de uso o HTTP, cada concepto necesita su
dominio y su adaptador de persistencia funcionando de punta a punta.

## Qué había antes

Solo existía la tabla `companies` (Fase 1) y su fila sembrada (Fase 2); no había ninguna clase
de dominio ni repositorio.
