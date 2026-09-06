# 2026-09-06 — Dashboard por tipo de usuario, reemplazando los datos hardcodeados

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`AccessTokenPayload.isInvestor`** (nuevo campo, booleano): calculado una sola vez al emitir
  el token (`UserType.isInvestor()`), mismo criterio que `isSuperAdmin` — agregado en
  `LoginUseCase`, `RefreshTokenUseCase` (recalculado) y `SwitchCompanyUseCase` (fijo en `false`,
  porque ese caso de uso ya exige `isSuperAdmin` y todo usuario tiene exactamente un `UserType`).
- **Nuevo módulo `Dashboard`** (backend): `DashboardRepository` (dominio, interfaces planas sin
  entidad propia), `DashboardRepositoryAdapter` (infraestructura — único repositorio del
  proyecto que inyecta entidades TypeORM de varios módulos a la vez: Kardex, Investment,
  Property), `GetInvestorDashboardUseCase`/`GetAdminDashboardUseCase`, `DashboardController`
  (`GET /dashboard/investor-summary`, `GET /dashboard/admin-summary`).
- **`app/(main)/dashboard` (frontend) reescrito por completo** — ya no tiene ningún dato
  hardcodeado (`mockMeses`, `mockTopInversionistas`, `mockLotesEnAlerta` desaparecieron). Nuevo
  hook `useIsInvestor()` (mismo patrón que `useIsSuperAdmin`) decide cuál de los dos
  sub-componentes mostrar.
- Ver `docs/dashboard/dashboard.md` para el detalle completo (qué significa cada número, por
  qué no hay ninguna tarjeta de "capital invertido", la iteración de layout descartada).

## Motivo

El usuario planteó la duda: "¿tiene sentido un dashboard para Super Administrador y
Administrador?" — coincidiendo en que esos roles ya tienen acceso directo a las pantallas
operativas completas (un resumen no les agrega nada), mientras que un Inversionista no tenía
ningún lugar que le mostrara un resumen de sus propias inversiones. Se confirmaron dos
decisiones antes de implementar:
1. Administrador/Super Administrador sí reciben KPIs reales (no un simple placeholder) —
   agregados de la empresa activa.
2. La detección de "es Inversionista" se resuelve agregando el dato al token (mismo patrón que
   `isSuperAdmin`), no infiriendo por si el usuario tiene inversiones propias.

## Decisiones de diseño

- **Ningún cálculo de dinero más allá de `SUM(total) WHERE movementType = 'venta'`**: revisando
  el modelo de datos se encontró que `KardexEntry.total` no tiene una fórmula definida todavía
  (documentado explícitamente en `docs/investment/investment.md`, Fase 1 del Kardex). Se le
  planteó esto al usuario antes de implementar — confirmó ir con el set de KPIs que sí tienen
  significado real, sin inventar "capital invertido" ni "ganancia".
- **`DashboardRepositoryAdapter` inyecta entidades TypeORM de otros módulos directo** (vía
  `TypeOrmModule.forFeature` registrado de nuevo en `DashboardModule`), en vez de pasar por los
  repositorios de dominio de Property/Investment/Kardex — esos exponen operaciones pensadas
  para su propio CRUD (paginado, filtros), no los `JOIN`s cruzados que necesita un reporte. Es
  el único módulo del proyecto con este criterio, documentado como tal.
- **`recentMovements[].entryDate` con `TO_CHAR(..., 'YYYY-MM-DD')` explícito**, no el valor
  crudo de la columna: `getRawMany()` no pasa por la hidratación de TypeORM (la que sabe
  devolver una columna `date` como texto puro) — sin este cast, el driver de Postgres entregaba
  la fecha como objeto `Date`, serializado como timestamp completo (`2026-03-18T04:00:00.000Z`)
  en vez de `2026-03-18` — rompiendo la regla ya documentada de "fecha pura, sin hora" del resto
  de la app. Encontrado y corregido durante la verificación en vivo contra `RedPecuariaTest`.
- **Sin chequeo de `isInvestor` en el backend para bloquear el endpoint "equivocado"**: mismo
  criterio (y misma limitación ya documentada) que el resto de la app — la autorización real es
  client-side.

## Qué había antes

`app/(main)/dashboard` mostraba 4 tarjetas KPI, un gráfico de barras y dos tablas, todo con
datos de ejemplo hardcodeados en el propio archivo (`mockMeses`, `mockTopInversionistas`,
`mockLotesEnAlerta`) — ningún `fetch` al backend, el mismo contenido para cualquier usuario sin
importar su tipo o empresa. No existía ningún endpoint de dashboard en el backend.
