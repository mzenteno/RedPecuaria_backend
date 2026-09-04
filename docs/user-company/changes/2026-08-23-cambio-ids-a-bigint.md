# 2026-08-23 — Corrección: ids de UUID a bigint

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

El id de `user_companies` (y de las demás tablas del módulo `auth`) pasa de `uuid` a
`bigint GENERATED ALWAYS AS IDENTITY`. Incluye también `user_id`, `company_id` y `role_id`
como `bigint` (antes `uuid`).

## Motivo

Se planteó inicialmente UUID por dos razones: (1) el dominio necesitaría el id antes de
persistir para el patrón cabecera+detalle transaccional, y (2) evitar ids adivinables. Al
revisar el punto (1), se confirmó que no es necesario: se puede insertar la cabecera, leer el
id generado por la base (`INSERT ... RETURNING id`, que TypeORM hace automáticamente), y
usarlo para el detalle, todo dentro de la misma transacción — igual que con UUID. Sin ese
motivo, no se consideró suficientemente fuerte mantener UUID solo por la razón (2), y se
priorizó `bigint` por ser más liviano y más simple de depurar.

## Qué había antes

`id uuid NOT NULL` como llave primaria y `user_id`, `company_id`, `role_id` como FKs `uuid`.
