# 2026-09-08 — El saldo (cantidad/kilos/total) vive en Investment, no en cada fila de Kardex

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`balance_quantity`/`balance_kilos` salen de `kardex_entries`** y se agregan a `investments`
  junto con un `total` nuevo (`balance_quantity` int, `balance_kilos`/`total` numeric) —
  migración `MoveKardexBalanceToInvestment1788600000000`, sin migrar datos existentes (a pedido
  del usuario, todavía en fase de desarrollo). `kardex_entries.total` no se toca — sigue siendo
  el monto que tipea el usuario en Ingreso/Venta.
- **`Investment` gana `balanceQuantity`/`balanceKilos`/`total`** (arrancan en 0 en
  `Investment.create()`) y un método nuevo, `applyBalanceDelta(delta)`, que suma/resta el delta
  y lanza `InsufficientInvestmentBalanceException` si dejaría `balanceQuantity`/`balanceKilos`
  en negativo. `total` no tiene ese piso (es dinero acumulado, no una existencia física).
- **`computeMovementDelta`** (nuevo, `application/kardex/compute-movement-delta.ts`) traduce un
  `KardexEntryFields` al delta a aplicar, según `movementType`:
  - Ingreso: `+entryQuantity`, `+entryKilos`, `+total`.
  - Baja: `-exitQuantity` solamente — no toca kilos ni total (una Baja no pide kilos como input
    ni tiene total).
  - Venta: `-exitQuantity`, `-exitKilos`, `+total`.
- **`CreateKardexEntryUseCase`** ahora es transaccional (`TRANSACTION_MANAGER`, antes no lo
  era): guarda el `KardexEntry` y aplica su delta a la `Investment` en la misma transacción.
  Valida además que **la primera fila activa de una inversión sea "ingreso"**
  (`hasAnyActiveEntry` nuevo en `KardexEntryRepository`) — `FirstKardexEntryMustBeIngresoException`
  si no.
- **`UpdateKardexEntryUseCase`** aplica el delta **neto** (nuevo − viejo) en vez de no tocar el
  saldo — evita rechazar de más un estado intermedio que nunca existió (ej. sacar el ingreso
  viejo antes de sumar el nuevo).
- **`DeactivateKardexEntryUseCase`** revierte el delta del movimiento (delta invertido) antes de
  marcarlo `isDeleted` — antes desactivar una fila no tocaba ningún saldo (no existía este
  concepto).
- **DTOs de Kardex** (`Create`/`UpdateKardexEntryRequestDto`) ya no reciben `balanceQuantity`/
  `balanceKilos` — el saldo lo calcula el servidor, nunca el cliente.
- **`InvestmentResponseDto`** agrega `balanceQuantity`/`balanceKilos`/`total`.
- **`DashboardRepositoryAdapter.getInvestorSummary`**: el saldo de cada inversión (`Mis
  inversiones`) se lee directo de `investment.balance_quantity`/`balance_kilos` en la misma
  consulta — reemplaza la consulta N+1 que antes buscaba "la última fila de kardex" por
  inversión (ya no existe ese dato ahí). `sumSales`/`getTopInvestors`/`getRecentMovements` no
  cambian: siguen sumando `kardex_entries.total` de movimientos "venta", que no se tocó.

## Motivo

El saldo corrido por fila de kardex (una foto del estado después de cada movimiento) ya no
alcanzaba: hacía falta poder validar en el momento de crear un movimiento si la inversión tiene
stock suficiente, sin tener que buscar y sumar el historial completo cada vez. Se decidió
mantener el saldo VIGENTE en `Investment`, actualizado transaccionalmente en cada alta/edición/
baja de kardex — excepción deliberada al criterio de "no duplicar datos derivados" del resto del
proyecto (ver por ejemplo el Dashboard), justificada porque este dato se necesita leer en el
camino caliente de cada escritura, no solo para mostrarlo.

## Decisiones de diseño

- **`kardex_entries` pasa a ser un log puro**: ya no tiene ninguna noción de saldo propio. Toda
  la lógica de "cuánto queda" vive en `Investment`.
- **La regla "primera transacción = ingreso" solo se valida al crear**, no al editar — editar la
  fila que resulta ser la única/primera de una inversión y cambiarle el tipo no está bloqueado
  hoy (caso raro, se puede agregar después si hace falta).
- **`total` es dato manual del usuario en Ingreso y Venta** (no un cálculo), y se acumula en
  `Investment.total` sumando siempre (nunca resta) — confirmado explícitamente con el usuario.
- **Baja no toca `balanceKilos`** — confirmado explícitamente: una Baja (ej. muerte de un
  animal) resta cabezas, pero no se descuenta ningún kilaje estimado.

## Qué había antes

`kardex_entries.balance_quantity`/`balance_kilos` guardaban una foto del saldo después de cada
movimiento, cargada a mano por el usuario (Fase 1, "sin ningún cálculo" — ver "Decisiones de
alcance" en `investment.md`). No había ninguna validación de que la primera fila fuera "ingreso"
ni de que un movimiento no dejara el saldo negativo. Verificado en vivo contra `RedPecuariaTest`:
se creó una inversión nueva, se confirmó el rechazo de una Venta como primer movimiento, un
Ingreso de 100 cabezas/17500 kg/total 50000, una Baja de 5 (sin tocar kilos), una Venta de 10/
1800 kg/total 6000 (saldo resultante 85/15700/56000, exacto), el rechazo de una Venta de 200
(saldo insuficiente), la reversión completa del saldo al desactivar esa venta, y el delta neto
correcto al editar la Baja convirtiéndola en un Ingreso de 20/3500/8000.
