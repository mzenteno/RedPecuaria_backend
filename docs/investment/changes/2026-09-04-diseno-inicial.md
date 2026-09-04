# 2026-09-04 — Diseño e implementación inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

`Investment` (negocio de compra de ganado + inversionistas) y `KardexEntry` (ficha de
movimientos) completos: dominio, persistencia, casos de uso, controllers, y las 2 pantallas del
frontend (`app/(main)/investments` y `app/(main)/investments/[id]/kardex`). Ver
`docs/investment/investment.md` para el detalle completo de las decisiones de alcance de esta
primera fase (deliberadamente sin ningún cálculo).

## Motivo

Segundo y tercer módulo del negocio ganadero (después de `Property`), a pedido explícito del
usuario, basado en una planilla de Kardex real. Diseñado en varias rondas de preguntas y
respuestas para acotar bien el alcance antes de escribir código — ver "Decisiones de alcance"
en `investment.md`.

## Qué había antes

No existía ningún concepto de inversión ni kardex en el sistema.
