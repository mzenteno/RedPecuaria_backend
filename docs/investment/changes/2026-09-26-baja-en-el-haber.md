# Una Baja en modo "por dinero" también cuenta como Haber

**Estado:** ✅ implementado, 2026-09-26.

## El reporte

En una inversión "por dinero" (ver
[2026-09-23-inversion-por-kilo-o-por-dinero.md](./2026-09-23-inversion-por-kilo-o-por-dinero.md) y
[2026-09-24-baja-merma-saldo.md](./2026-09-24-baja-merma-saldo.md)), una fila de Baja mermaba el
saldo correctamente (tanto el saldo vigente de la inversión como el saldo corrido fila por fila),
pero su columna "Haber" quedaba siempre en blanco. El usuario lo señaló con una captura del
Kardex: *"la baja si esta mermando el saldo pero no esta colocando en el haber xq al final es
salida de dinero"* — una Baja es, en modo "por dinero", una salida de plata igual que una Venta, y
como tal debería sumar al Haber.

## Por qué pasaba

`KardexEntryMapper.toListResponse` (antes de este cambio) calculaba `haber` así:

```ts
debe: isIngreso ? entry.fields.total : 0,
haber: isIngreso ? 0 : entry.fields.total,
```

`entry.fields.total` es el campo que el usuario tipea a mano en Ingreso/Venta ("Total Bs.",
siempre presente sin importar si la inversión es "por kilo" o "por dinero") — pero en Baja ese
campo **nunca se toca, se mantiene en `0` siempre** (ver `KardexEntry`,
`docs/investment/changes/2026-09-24-baja-merma-saldo.md`): el valor real de una Baja vive en
`avgWeight` (reusado con otro título en el diálogo — "Salida — kilos"/"Total Bs.", ver
`KardexEntryDialog`), no en `total`. Por eso `entry.fields.total` daba siempre `0` para cualquier
Baja, y el Haber calculado a partir de ese campo daba `0` también, sin ningún caso especial.

Esto era, en rigor, el diseño ORIGINAL a propósito ("Baja nunca tiene Haber, para no ensuciar
Debe/Haber", ver el comentario que tenía `kardex-entry.mapper.ts`) — pero ese diseño no
consideraba el modo "por dinero", donde el valor de la Baja SÍ es plata real que sale de la
inversión, y por lo tanto sí debería figurar en el Haber.

## Por qué no alcanza con leer `avgWeight` a secas

`avgWeight` es el mismo campo para los dos modos de inversión, pero significa cosas distintas
según el tipo:

- **Modo "por kilo"**: `avgWeight` de una Baja es la merma en **KILOS** — no hay ningún dato de
  dinero cargado en esa fila (el diálogo ni siquiera pide un campo de plata para Baja en este
  modo, ver `KardexEntryDialog`). Sumar ese número al Haber sería mostrar un número que no es
  dinero, y ensuciaría el footer Debe/Haber con una unidad equivocada.
- **Modo "por dinero"**: `avgWeight` de una Baja es el monto en **Bs.** que salió — ahí sí es
  plata real, y corresponde que cuente como Haber.

Por eso la corrección necesita saber el tipo de la inversión (`Investment.investmentTypeId`) al
resolver `haber`, no solo mirar `movementTypeName`.

## Qué cambió

**El cálculo se movió del mapper HTTP al repositorio** (`KardexEntryRepositoryAdapter.findActiveByInvestment`),
porque ahí es donde ya se resuelve todo lo que depende del tipo de inversión (ver
`FindKardexEntriesParams.investmentTypeIsDinero`, nuevo parámetro que
`ListKardexEntriesByInvestmentUseCase` resuelve una vez, con un fetch adicional de `Investment` +
`InvestmentType` — mismo patrón de doble fetch que ya usa `CreateKardexEntryUseCase`). El SQL de
la consulta paginada agrega dos columnas nuevas junto al resto de cálculos por fila:

```sql
CASE WHEN movementType.name = 'ingreso' THEN entry.total ELSE 0 END               AS debe
CASE
  WHEN movementType.name = 'venta' THEN entry.total
  WHEN movementType.name = 'baja'  THEN <avg_weight o 0, según investmentTypeIsDinero>
  ELSE 0
END                                                                                AS haber
```

`KardexEntryWithRunningBalance` (dominio) ahora trae `debe`/`haber` ya resueltos — el mapper HTTP
(`KardexEntryMapper.toListResponse`) solo los pasa tal cual, sin volver a calcular nada. El
footer (`totalDebe`/`totalHaber`, TODO el historial activo, no solo la página) también se
simplificó: antes recalculaba mirando `movementTypeName` a mano, ahora solo suma los `debe`/`haber`
que ya vienen resueltos por fila.

**Frontend** (`kardex-table.tsx`, `kardex-pdf.ts`): la columna "Haber" pasa de mostrarse solo en
Venta a mostrarse en Venta **o en Baja cuando `investmentTypeName === 'dinero'`** — nunca en Baja
+ modo "por kilo" (ahí el backend ya devuelve `0`, pero además la celda se deja en blanco a
propósito, mismo criterio de "celdas vacías, no `0,00`" del resto de la tabla, ver
`docs/investment/changes/2026-09-24-baja-merma-saldo.md`).

## Verificado

`tsc --noEmit`/`eslint`/`next build`/`nest build` en los dos proyectos (limpios) — sin prueba en
vivo, a pedido del usuario (ver memoria del proyecto: no levantar backend/frontend para
verificar).
