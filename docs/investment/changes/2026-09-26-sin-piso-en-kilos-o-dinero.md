# `balanceKilos`/`total` dejan de tener piso en 0 (solo `balanceQuantity` lo tiene)

**Estado:** ✅ implementado, 2026-09-26.

## El reporte

Con una inversión "por dinero" casi agotada (saldo de 41.500,00 Bs.), una Venta cuyo "Total Bs."
era mayor a ese saldo (Bs. 56.000,00) tiraba `InsufficientInvestmentBalanceException` ("La
inversión no tiene saldo suficiente para este movimiento"), aunque la cantidad de cabezas
(`balanceQuantity`) sí alcanzaba de sobra. El usuario lo señaló directo: *"en la venta y la baja,
el saldo se va mermando pero el saldo kilos/dinero no hace falta q valides q va bajar de 0 xq es
totalmente posible"*.

## Por qué es correcto que sea negativo

`balanceQuantity` (cabezas) es un conteo físico real — nunca puede haber "-3 cabezas", así que su
piso en 0 sigue siendo válido y se mantiene. `balanceKilos`/`total`, en cambio, son un ACUMULADO
de valores promedio que varían movimiento a movimiento (`avgWeight`/precio de cada Venta o Baja
puntual no tiene por qué coincidir con el promedio acumulado de todo el historial anterior). Nada
impide, en la práctica, que una Venta puntual valga más en Bs. (o pese más en kilos) que el
promedio con el que se cargó el stock originalmente — el saldo secundario quedando negativo no es
un error de carga, es un reflejo válido de esa diferencia. Exigirle piso en 0 a este campo
bloqueaba operaciones legítimas.

## Qué cambió

**`Investment.applyBalanceDelta`** (`src/domain/investment/entities/investment.ts`) — antes:

```ts
applyBalanceDelta(delta: InvestmentBalanceDelta, investmentType: InvestmentType): void {
  const newBalanceQuantity = this._balanceQuantity + delta.quantity;
  const newBalanceKilos = this._balanceKilos + delta.kilos;
  const newTotal = this._total + delta.total;
  const secondaryFloorBreached = investmentType.isDinero() ? newTotal < 0 : newBalanceKilos < 0;
  if (newBalanceQuantity < 0 || secondaryFloorBreached) {
    throw new InsufficientInvestmentBalanceException(this._id ?? '(nueva)');
  }
  this._balanceQuantity = newBalanceQuantity;
  this._balanceKilos = newBalanceKilos;
  this._total = newTotal;
}
```

Ahora:

```ts
applyBalanceDelta(delta: InvestmentBalanceDelta): void {
  const newBalanceQuantity = this._balanceQuantity + delta.quantity;
  if (newBalanceQuantity < 0) {
    throw new InsufficientInvestmentBalanceException(this._id ?? '(nueva)');
  }
  this._balanceQuantity = newBalanceQuantity;
  this._balanceKilos = this._balanceKilos + delta.kilos;
  this._total = this._total + delta.total;
}
```

El método ya no recibe `InvestmentType` — solo lo necesitaba para decidir cuál de los dos campos
(`balanceKilos`/`total`) validar, y esa validación desapareció. Quien llama (`CreateKardexEntryUseCase`,
`UpdateKardexEntryUseCase`, `DeactivateKardexEntryUseCase`) sigue resolviendo el `InvestmentType`
igual que antes, porque lo sigue necesitando para `computeMovementDelta` — solo se le sacó el
segundo argumento a las tres llamadas a `applyBalanceDelta`.

`docs/investment/investment.md` y el comentario de `InvestmentType` actualizados para reflejar
que el piso en 0 es exclusivo de `balanceQuantity`.

## Verificado

`tsc --noEmit`/`eslint` en el backend (limpios) — sin prueba en vivo, a pedido del usuario (ver
memoria del proyecto: no levantar backend/frontend para verificar).
