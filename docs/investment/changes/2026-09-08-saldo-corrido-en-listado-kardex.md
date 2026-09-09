# 2026-09-08 — Saldo corrido por fila en el listado de Kardex, calculado con una función de ventana SQL

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`GET /kardex-entries` agrega `runningBalanceQuantity`/`runningBalanceKilos` a cada fila** —
  el saldo (cantidad/kilos) que queda DESPUÉS de ese movimiento puntual, calculado al leer con una
  función de ventana SQL (`SUM(CASE ...) OVER (ORDER BY entry_date, created_at)`) sobre todo el
  historial activo de la inversión. Nunca se guarda — solo lo devuelve el listado
  (`findById`/`save` siguen trabajando con `KardexEntry` a secas).
- **`KardexEntryRepository.findActiveByInvestment`** devuelve `KardexEntryWithRunningBalance`
  (`{ entry, runningBalanceQuantity, runningBalanceKilos }`) en vez de `KardexEntry` a secas.
- **`KardexEntryListItemResponseDto`** (nuevo, extiende `KardexEntryResponseDto`) — solo para
  `GET /kardex-entries`; `POST`/`PATCH` siguen devolviendo `KardexEntryResponseDto` sin estos 2
  campos (crear/editar una fila no necesita su posición en el historial).
- **Paginación en memoria, no en SQL**: `findActiveByInvestment` trae TODO el historial activo
  (filtrado) de la inversión, calcula el saldo corrido sobre el conjunto completo, y recién
  después corta la página pedida con `.slice()` en JavaScript — ver "Qué había antes" para el
  motivo (un bug real de TypeORM que se encontró al verificar esto).

## Motivo

El usuario mostró la planilla Excel de referencia: tiene una columna "SALDOS" (cantidad y kilos)
que arranca en el Ingreso inicial y va mermando con cada movimiento — el equivalente visual a lo
que `balance_quantity`/`balance_kilos` mostraban antes por fila en `kardex_entries` (ver el change
`2026-09-08-saldo-en-inversion-no-en-kardex.md`, que sacó esas columnas de ahí). La pregunta fue
si mover el saldo a `Investment` significaba perder esa vista. No: el histórico se puede seguir
mostrando, solo que calculado al leer en vez de guardado — mismo criterio de "no duplicar un dato
derivable" que ya se usa en el Dashboard.

## Decisiones de diseño

- **Función de ventana SQL, no cálculo en el frontend**: acumular en el cliente solo funciona si
  se trae la lista completa sin paginar — con paginación de servidor (que Kardex sí tiene), la
  página 2 no sabría desde qué saldo arrastra la página 1 y arrancaría mal, de cero. La ventana
  SQL evita esto calculando sobre el conjunto completo antes de paginar.
- **Un solo `JOIN` incondicional a `kardex_movement_types`** (antes solo se unía cuando había
  `restrictSalesToInvestorId`) — la fórmula del saldo corrido también necesita el nombre del tipo
  de movimiento, así que ahora el filtro de privacidad y el cálculo comparten el mismo join, sin
  duplicarlo.
- **DTO de listado separado (`KardexEntryListItemResponseDto`)** en vez de agregar los 2 campos al
  `KardexEntryResponseDto` general — `POST`/`PATCH` no tienen de dónde sacar "la posición de esta
  fila en el historial completo" sin una consulta extra, y no la necesitan (solo confirman que la
  escritura salió bien).

## Qué había antes

`kardex_entries` no tenía ningún saldo por fila (se había sacado en el change anterior del mismo
día) y el frontend mostraba únicamente el saldo VIGENTE de la inversión en el encabezado de la
pantalla.

**Bug real encontrado durante la verificación**: la primera versión de este cambio agregaba la
función de ventana directamente sobre una consulta con `.skip()`/`.take()` (paginación de
TypeORM). Verificado en vivo contra `RedPecuariaTest` con `pageSize=1`: la página 2 mostraba el
saldo corrido de la fila 2 como si fuera la PRIMERA del historial (ej. `120`/`21000` en vez de
`120`/`21000` acumulado real — la fila se veía a sí misma nomás), y la página 3 mostraba números
negativos sin sentido. La causa: TypeORM, al combinar `skip`/`take` con un `JOIN`, envuelve la
consulta en una subconsulta que resuelve qué filas van en esa página ANTES de calcular la función
de ventana — cada página terminaba viendo la ventana calculada solo sobre su propia fila, no sobre
el historial completo. Se corrigió trayendo todo el historial activo sin `skip`/`take` de SQL y
paginando el arreglo ya calculado en memoria (`.slice()`). Reverificado con `pageSize=1` en las 3
páginas de una inversión con 3 movimientos (Ingreso 100/17.500 → 120/21.000 → Venta →
117/20.500): saldo corrido correcto y consistente en las tres páginas.
