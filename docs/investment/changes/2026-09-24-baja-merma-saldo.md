# "Baja" ahora merma el saldo (kilos o dinero)

**Estado:** ✅ implementado, 2026-09-24.

## Qué pedía el usuario

Hasta este cambio, "Peso promedio" en un movimiento de Baja era un dato puramente informativo —
`computeMovementDelta` devolvía `{ quantity: -exitQuantity, kilos: 0, total: 0 }`, sin tocar
`balanceKilos` ni `total`. El usuario pidió que sí lo haga: una Baja tiene que mermar el saldo,
igual que Ingreso/Venta.

## Cómo se resolvió (dos vueltas el mismo día)

**Primer intento** (descartado): mantener el campo como "Peso promedio" (un valor por cabeza) y
derivar el total perdido como `avgWeight × exitQuantity`. El usuario lo corrigió: si ese valor
resta directo del saldo, tiene que llamarse y comportarse **igual que el campo equivalente de
Venta** ("Salida — kilos" en modo kilo, "Total Bs." en modo dinero) — un valor directo, no un
promedio a multiplicar.

**Versión final**: Baja pide "Salida — cantidad" + un segundo campo con el MISMO título/estilo
(`FormattedNumberInput`) que usa Venta — "Salida — kilos" en modo "kilo", "Total Bs." en modo
"dinero" — pero por debajo sigue guardado en el campo `avgWeight` de `KardexEntry` (no se agregó
ninguna columna nueva; solo cambió cómo se etiqueta y qué representa para este tipo de
movimiento). `computeMovementDelta` (`application/kardex`) usa ese valor **directo**, sin
multiplicar por cantidad:

```ts
if (fields.movementType.isBaja()) {
  return {
    quantity: -fields.exitQuantity,
    kilos: fields.investmentType.isDinero() ? 0 : -fields.avgWeight,
    total: fields.investmentType.isDinero() ? -fields.avgWeight : 0,
  };
}
```

En inversiones "por kilo" resta de `balanceKilos`; en "por dinero" resta de `total` — mismo
criterio que ya tienen Ingreso/Venta con el tipo de inversión (ver
[2026-09-23-inversion-por-kilo-o-por-dinero.md](./2026-09-23-inversion-por-kilo-o-por-dinero.md)).
El piso en 0 (`InsufficientInvestmentBalanceException`) ya lo maneja `Investment.
applyBalanceDelta` sin ningún cambio — es genérico al delta que le llega.

**Por qué NO se usa el campo `total` de `KardexEntry` para el modo "dinero" de Baja** (aunque se
llama igual en pantalla, "Total Bs."): `total` es el campo que `KardexEntryMapper` usa para
Debe/Haber (`haber = isIngreso ? 0 : total`) — si Baja escribiera ahí, su pérdida empezaría a
contarse como "Haber" (dinero recuperado) en el footer, lo cual es incorrecto (una baja es una
pérdida, no una recuperación). Por eso el valor de Baja en modo dinero sigue viviendo en
`avgWeight` (con otra etiqueta en pantalla) y `total` de Baja se mantiene siempre en `0`, como
antes.

## Bug encontrado por el usuario en vivo (mismo día): el saldo corrido por fila no bajaba

`Investment.balanceKilos`/`total` (el saldo VIGENTE, "Saldo actual" arriba de la tabla)
funcionaba bien desde el primer intento — pero la columna "Saldo — Kilos"/"Saldo — Bs." de
**cada fila** del listado (`runningBalanceKilos`/`runningBalanceTotal`, calculada aparte con una
función de ventana SQL en `KardexEntryRepositoryAdapter.findActiveByInvestment`, ver
`changes/2026-09-08-saldo-corrido-en-listado-kardex.md`) seguía sin bajar en las filas de Baja —
me olvidé de actualizar el `CASE` de esa consulta cuando cambié `computeMovementDelta`. Corregido
agregando la rama de `'baja'` a los dos `CASE` (kilos y total), restando `entry.avg_weight` en
las dos, igual criterio que en `computeMovementDelta`:

```sql
CASE
  WHEN "movementType"."name" = 'ingreso' THEN entry.entry_kilos
  WHEN "movementType"."name" = 'venta' THEN -entry.exit_kilos
  WHEN "movementType"."name" = 'baja' THEN -entry.avg_weight   -- faltaba esto
  ELSE 0
END
```

## Qué NO cambió

- `CreateKardexEntryUseCase`/`UpdateKardexEntryUseCase`/`DeactivateKardexEntryUseCase` — solo
  empezaron a pasarle `avgWeight` a `computeMovementDelta`, que ya recibían de `input`/
  `entry.fields`.
- Debe/Haber (`totalDebe`/`totalHaber`, footer de Kardex) — Baja nunca tuvo `total` propio (sigue
  dando `haber: 0`), esto no lo toca.
- El schema de la base — sin migración nueva, `avgWeight` ya existía en `kardex_entries`.

Verificado con `tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en
vivo, a pedido del usuario (ver memoria del proyecto: no levantar backend/frontend para
verificar).
