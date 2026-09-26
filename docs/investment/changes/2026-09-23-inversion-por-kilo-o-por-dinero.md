# Inversión "por kilo" o "por dinero"

**Estado:** ✅ implementado y verificado (backend + frontend), 2026-09-23.

## Qué pedía el usuario

Hasta ahora toda inversión trackeaba, además de la cantidad de cabezas, los **kilos** por
movimiento (Ingreso/Venta) — el saldo físico vigente vivía en `Investment.balanceKilos`. El
usuario pidió un segundo modo, idéntico en todo lo demás, donde en vez de kilos se anota
**dinero**: mismos tipos de movimiento (Ingreso/Venta/Baja), misma regla de cantidad de cabezas,
solo cambia qué "segunda magnitud" se trackea por movimiento.

## Decisiones tomadas con el usuario

1. **El "dinero" de una inversión por-dinero es el mismo campo `total` que ya existía** (el que
   se usa para Debe/Haber), no un campo nuevo — en modo "dinero" no se piden/muestran kilos.
2. **"Peso promedio" tiene un equivalente en dinero** ("monto promedio" = `total / cantidad`), no
   se oculta el campo.
3. **El tipo se elige una sola vez al crear la inversión y queda fijo para siempre** — no se
   puede editar después, no está en `UpdateInvestmentRequestDto`.
4. **En modo "dinero", Venta RESTA de `total`** (con piso en 0, `InsufficientInvestmentBalance
   Exception` si no alcanza) — al revés que en modo "kilo", donde Venta siempre SUMA su `total`
   (ver `computeMovementDelta`). Sin este cambio, `total` en modo dinero no sería un equivalente
   real de `balanceKilos` (sin ningún control de sobregiro).

## Por qué catálogo (`investment_types`) y no un `varchar`/enum

Primer intento: un `varchar` con el texto `'kilo'`/`'dinero'` repetido en cada fila. El usuario lo
frenó — es exactamente el mismo error que ya se había cometido una vez con `movement_type`
(`kardex_entries.movement_type` era un `varchar(20)` con el texto literal, corregido en
`AddKardexMovementTypesTable` por el mismo motivo). Evaluadas dos alternativas (enum nativo de
Postgres vs. tabla catálogo), el usuario eligió la tabla catálogo, igual forma que
`kardex_movement_types`: `investment_types` (id/name/isDeleted/createdAt) + `investments.
investment_type_id` (FK) + `InvestmentType` (dominio, `isKilo()`/`isDinero()`) + repositorio +
`ListInvestmentTypesUseCase` + `GET /investment-types`.

## Qué cambió

### Backend

- **Migración** `AddInvestmentTypesTable`: crea `investment_types` (sembrada con `'kilo'`/
  `'dinero'`), agrega `investments.investment_type_id` (FK, `NOT NULL`, backfill a `'kilo'` para
  las filas existentes — es el único modo que existió hasta ahora).
- **`Investment`** (dominio): nuevo campo `investmentTypeId` (fijo, `update()` no lo toca).
  `applyBalanceDelta` ahora recibe el `InvestmentType` ya resuelto (mismo criterio que
  `computeMovementDelta` recibe el `MovementType` resuelto — la entidad no conoce el catálogo) y
  decide QUÉ campo no puede quedar negativo según el tipo: `balanceKilos` en "kilo", `total` en
  "dinero".
- **`computeMovementDelta`**: recibe también el `InvestmentType` resuelto. En "dinero", el delta
  de Venta sobre `total` es `-total` (en vez de `+total`); todo lo demás (kilo, quantity, Baja,
  Ingreso) sigue exactamente igual.
- **`CreateKardexEntryUseCase`/`UpdateKardexEntryUseCase`/`DeactivateKardexEntryUseCase`**:
  resuelven el `InvestmentType` de la inversión (una consulta más, mismo lugar donde ya cargan
  `investment`) antes de aplicar el delta.
- **Sin validación server-side de "kilos en 0 en modo dinero"** — decisión consciente, mismo
  criterio que ya usa "Baja" hoy (el formulario del frontend no pide/manda esos campos, el
  backend confía en el DTO).
- **Saldo corrido de Kardex**: nuevo `runningBalanceTotal` en el `SUM(...) OVER(...)` de
  `findActiveByInvestment`, mismo signo que `computeMovementDelta` en modo dinero. Se calcula
  siempre (la query ya está acotada a una sola inversión) — el frontend elige cuál de los dos
  (`runningBalanceKilos`/`runningBalanceTotal`) mostrar.
- **`totalDebe`/`totalHaber`** (footer Kardex): sin ningún cambio — se calculan aparte, a partir
  de `entry.fields.total` por fila, independiente de qué hace `Investment.applyBalanceDelta` con
  su propio acumulador.
- **N+1 evitado**: `investmentTypeName` en los listados (`by-gestion`/`by-property`/`by-investor`)
  se resuelve con UN `findAll()` (solo 2 filas) por request, no un `findById` por fila —
  `resolveInvestmentTypeNames` (helper compartido).

### Frontend

- `Investment`/`InvestmentListItem`/`CreateInvestmentData`: `+ investmentTypeId`,
  `+ investmentTypeName` (no en `UpdateInvestmentData` — inmutable).
- `InvestmentDialog`: combo "Tipo de inversión" (`useInvestmentTypes`, `GET /investment-types`)
  solo en el alta; en edición se muestra de solo lectura.
- `investment-table.tsx`: columna "Tipo" nueva.
- `KardexEntryDialog`: en modo "dinero", "Entrada — kilos"/"Salida — kilos" no se muestran (el
  único dato de esa fila es `total`, que ya existía en el formulario); "Peso promedio" pasa a
  llamarse "Monto promedio" (`computeAverage`, misma fórmula, con `total` en vez de kilos).
- `KardexTable`/`kardex-pdf.ts`: "Peso prom."/"Kilos" → "Monto prom."/"Dinero" en modo dinero; las
  celdas de Entrada/Salida reusan `debe`/`haber` (ya vienen exactamente así — Ingreso→`debe`,
  Venta→`haber`), "Saldo" usa `runningBalanceTotal`.
- `kardex/page.tsx`: "Saldo actual" muestra `total`/Bs. en vez de `balanceKilos`/kg cuando la
  inversión es "por dinero".

## Verificado en vivo (`RedPecuariaTest`, backend efímero puerto 3011)

Creada una inversión "por dinero", cargado un Ingreso (`total=50000`) y una Venta
(`total=20000`): `Investment.total` bajó a `30000` (resta correcta), `runningBalanceTotal` por
fila coincidió (`50000` → `30000`), `totalDebe`/`totalHaber` del footer (`50000`/`20000`)
quedaron correctos e independientes del signo de `total`. Una segunda Venta de `50000` (más de lo
que quedaba) lanzó `InsufficientInvestmentBalanceException` como se esperaba. Desactivados ambos
movimientos, el saldo volvió a `0`. Verificado además `tsc --noEmit`/`eslint`/`build` limpios en
los dos proyectos.
