# 2026-10-19 — "Terminada" pasa a ser por inversionista

**Rama:** main
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`investment_investors.is_finished` (boolean, default `false`)**: migración
  `AddIsFinishedToInvestmentInvestors`. Cada inversionista arranca con el valor que tenía su
  inversión, así el estado derivado coincide con el actual.
- **`InvestmentInvestor.isFinished` / `setFinished()`** (dominio). `applyBalanceDelta` lanza
  `InvestorInvestmentFinishedException` (409) si el inversionista está terminado. Como alta,
  edición y baja de un `KardexEntry` pasan todas por ahí, su Kardex queda **de solo lectura**.
- **`Investment.isFinished` pasa a ser derivado y guardado**: terminada = todos sus
  inversionistas terminados. `Investment.update()` ya no lo recibe; lo recalcula
  `syncInvestmentFinished` (`application/investment`) en la misma transacción de:
  - `SetKardexInvestorFinishedUseCase` (finalizar/reactivar a un inversionista);
  - `UpdateInvestmentUseCase` (sumar un inversionista reabre la inversión; sacar al único
    activo la termina).
- **`PATCH /kardex-entries/investor-status`** `{ investmentId, investorUserId, isFinished }` →
  204. Declarada antes de `PATCH /kardex-entries/:id`.
- **`GET /kardex-entries`**: `meta.investorIsFinished`.
- **`GET /investments/mine?status=active|finished`** filtra por el estado del inversionista
  (`ii.is_finished`), no por el de la inversión.
- **`UpdateInvestmentRequestDto`** ya no tiene `isFinished`.
- **Frontend**: se quitó el combo "Estado" de `InvestmentDialog`. En el Kardex hay un botón
  "Finalizar"/"Reactivar" (con confirmación, requiere `canEdit` de Kardex) y una etiqueta
  Activa/Terminada junto al saldo. Si está terminada, se ocultan "Nuevo movimiento",
  editar y eliminar. La columna "Estado" de Inversiones sigue igual, ahora con el valor derivado.

## Motivo

Desde 2026-10-14 el Kardex se lleva por inversionista. Cada uno cierra su parte de la
inversión por separado, así que terminar la inversión completa ya no alcanzaba.

## Decisiones de diseño

- **Se finaliza desde el Kardex del inversionista**: ahí se ve su saldo, que es lo que indica
  si ya vendió todo. Sigue siendo una elección manual: no se valida contra el saldo.
- **Bloqueo**: a diferencia del estado anterior (solo informativo), un inversionista terminado
  no admite movimientos. Para corregir algo hay que reactivarlo primero. Los movimientos
  históricos sin inversionista (`investorUserId = null`) no pasan por `InvestmentInvestor`, así
  que no se bloquean.
- **Derivado guardado en vez de calculado al leer**: así los 4 listados, el detalle y los
  mappers siguen leyendo `investments.is_finished` sin cambios. Es el mismo criterio que los
  saldos (`balance*`).
- **Sin chequeo de permiso en el backend**: igual que el resto de los endpoints de Kardex, el
  permiso por menú se aplica en el frontend.
