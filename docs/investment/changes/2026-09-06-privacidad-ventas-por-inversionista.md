# 2026-09-06 — Un inversionista no ve las ventas de otros inversionistas

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`GET /kardex-entries?investmentId=`** ahora filtra los movimientos de tipo "venta" cuando
  quien pide el listado es de tipo Inversionista (`isInvestor` del token, mismo campo que ya se
  usa en el dashboard) — solo ve las ventas atribuidas a **él mismo**
  (`entry.investor_user_id`), nunca las de otros inversionistas de la misma inversión. "ingreso"
  y "baja" nunca se filtran (son generales, sin inversionista, ver `docs/investment/
  investment.md`). Un Administrador/Super Administrador sigue viendo todas las ventas — el
  filtro no se aplica para ellos.
- `FindKardexEntriesParams` (dominio) agrega `restrictSalesToInvestorId?: string` —
  `KardexEntryRepositoryAdapter.findActiveByInvestment` lo traduce a
  `(entry.movement_type != 'venta' OR entry.investor_user_id = :restrictSalesToInvestorId)` en
  la query.
- `ListKardexEntriesByInvestmentInput` agrega `viewerIsInvestor`/`viewerUserId` — el
  `KardexEntryController` los resuelve de `@CurrentUser('isInvestor')`/`@CurrentUser('sub')`,
  nunca de un parámetro que mande el cliente.

## Motivo

El usuario reportó, viendo el kardex de una inversión logueado **como inversionista**: veía la
venta atribuida a otro inversionista de la misma inversión (nombre y monto incluidos) — un dato
que no le corresponde ver. Pidió explícitamente que, entrando como inversionista, el kardex
muestre ingresos y bajas (generales) más solo las ventas propias, nunca las de otros.

## Decisiones de diseño

- **El filtro vive en la query del backend, no en el frontend**: aunque hubiera sido más rápido
  ocultar las filas ajenas del lado del cliente (ej. en `KardexTable`), eso no evita que
  cualquiera con el token pueda ver el dato real llamando a la API directo (`curl`, devtools) —
  mismo criterio de seguridad que el resto del proyecto, nunca confiar en que el frontend oculte
  algo sensible.
- **El filtro es transparente para Administrador/Super Administrador**: `viewerIsInvestor` sale
  del `UserType` real del que llama (no de si la inversión "es suya"), así que un Administrador
  gestionando el kardex de cualquier inversión sigue viendo todo, sin ningún cambio de
  comportamiento para ese rol.
- **No se tocó `assertKardexInvestor`** (la validación al crear/editar una fila de kardex, que
  ya exige que el `investorUserId` de una "venta" sea uno de los inversionistas reales de la
  inversión) — es una regla distinta (integridad de datos al escribir), esta es sobre qué se
  puede **leer** después.

## Qué había antes

`GET /kardex-entries?investmentId=` devolvía todas las filas activas de la inversión sin
importar quién las pidiera — un inversionista veía las ventas de todos los demás
inversionistas de esa misma inversión, con nombre y monto. Verificado en vivo contra
`RedPecuariaTest`: se creó un segundo inversionista de prueba, una venta atribuida a cada uno, y
se confirmó que cada uno ve la suya pero no la del otro — mientras que un Administrador sigue
viendo ambas.
