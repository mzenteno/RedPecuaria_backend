# 2026-09-04 — Tipo de movimiento e inversionista en Kardex

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

`KardexEntry` gana dos campos: `movementType` (`'ingreso' | 'venta' | 'baja'`, catálogo fijo) e
`investorUserId` (nullable). Regla nueva, validada en `CreateKardexEntryUseCase` /
`UpdateKardexEntryUseCase` vía el helper compartido `assertKardexInvestor`: solo "venta" admite
inversionista (obligatorio, de la lista de inversionistas de esa inversión puntual); "ingreso" y
"baja" no admiten ninguno. Frontend: el diálogo de Kardex agrega el combo "Tipo de movimiento" y
muestra/oculta los campos de Entrada, Salida e Inversionista según la elección; la tabla agrega
columnas "Tipo" e "Inversionista".

## Motivo

A pedido del usuario, revisando la planilla de referencia real: el "Ingreso" es general para
toda la inversión, la "Venta" se reparte a un inversionista puntual (columna con las iniciales
del inversionista en la planilla), y la "Baja" es general como el ingreso.

## Qué había antes

`KardexEntry` no distinguía tipos de movimiento ni tenía ningún concepto de inversionista por
fila — decisión explícita de la Fase 1 (ver "Decisiones de alcance" más arriba en este mismo
documento, punto 5: "por el momento registralo sin inversionista"), revisada ahora para el caso
puntual de "Venta".
