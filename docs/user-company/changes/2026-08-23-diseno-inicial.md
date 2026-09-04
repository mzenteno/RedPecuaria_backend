# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `UserCompany` como el vínculo usuario↔empresa↔rol, habilitando que un mismo usuario
participe en varias empresas con roles distintos en cada una.

## Motivo

Requisito explícito del proyecto: la aplicación es multiempresa, con usuario administrador e
inversionista, y un mismo usuario puede necesitar roles distintos según la empresa.

## Qué había antes

Se había nombrado inicialmente `Membership` para este mismo concepto; se renombró a
`UserCompany` (tabla `user_companies`) antes de implementarse, por pedido explícito, para que
el nombre sea más descriptivo.
