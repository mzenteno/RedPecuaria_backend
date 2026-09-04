# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `Company` como entidad raíz del multiempresa: id, nombre, estado activo/inactivo.
Es el punto de anclaje del que cuelgan `Role` y `UserCompany`.

## Motivo

El sistema es multiempresa: un mismo usuario puede participar en varias empresas con roles
distintos en cada una. Se necesita una entidad que represente a "la empresa" de forma
independiente de usuarios y roles.

## Qué había antes

N/A — es el diseño inicial de este concepto.
