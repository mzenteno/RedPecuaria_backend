# 2026-09-08 — Estado Activa/Terminada en Investment, elegido a mano por el usuario

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`investments.is_finished` (boolean, default `false`)** — migración `AddIsFinishedToInvestments`.
- **`Investment.isFinished`** (dominio) — se agrega a `create()` (siempre `false`), `update()`
  (nuevo parámetro), `fromPersistence`/`toPersistence`. Sin ninguna regla que lo derive del
  saldo — es un valor que solo cambia si el caso de uso lo recibe explícito.
- **`UpdateInvestmentUseCase`/`UpdateInvestmentRequestDto`** agregan `isFinished: boolean`
  (obligatorio, `@IsBoolean()`). `CreateInvestmentUseCase`/`CreateInvestmentRequestDto` NO lo
  reciben — una inversión nueva siempre arranca activa.
- **`InvestmentResponseDto`** agrega `isFinished`.
- **Frontend**: `InvestmentDialog` agrega un combo "Estado" (Activa/Terminada), **visible solo en
  modo edición** (no tiene sentido elegirlo al crear). `InvestmentTable` agrega una columna
  "Estado" con una etiqueta de color (verde "Activa" / gris "Terminada", mismo criterio visual
  que el resto de la app). `investments/page.tsx` separa el payload de alta (sin `isFinished`)
  del de edición (con `isFinished`), aunque los dos modos comparten el mismo diálogo/formulario.

## Motivo

El usuario pidió una forma de marcar cuándo una inversión terminó su ciclo (se vendió todo el
stock que había ingresado) — a diferencia de "desactivar" (`isDeleted`, una baja administrativa
que oculta el registro), esto es un dato de negocio: la inversión sigue totalmente visible y
operable, solo cambia una etiqueta de estado.

## Decisiones de diseño

- **Elección manual, no calculada**: se consideró marcarlo solo automáticamente cuando
  `balanceQuantity` llega a 0, pero el pedido explícito fue que el USUARIO lo marque a mano — el
  sistema no fuerza nada. Queda documentado acá por si más adelante se pide automatizarlo.
- **Sin validación que bloquee kardex sobre una inversión terminada**: a propósito, por ahora —
  no se pidió impedir seguir registrando movimientos sobre una inversión ya marcada como
  Terminada. Si hace falta esa regla, es un cambio aparte (a confirmar con el usuario, cambia
  comportamiento existente).
- **Campo solo de edición, no de alta**: `Investment.create()` no lo acepta como parámetro —
  ni siquiera tiene sentido pedirlo, una inversión recién creada no puede empezar terminada.

## Qué había antes

No existía ningún concepto de estado de la inversión más allá de `isDeleted` (baja
administrativa). Verificado en vivo contra `RedPecuariaTest`: se marcó una inversión real como
Terminada (`PATCH /investments/:id` con `isFinished: true`), se confirmó que persiste y se
devuelve en la respuesta, se confirmó el rechazo (`400`) de un `PATCH` sin `isFinished` en el
body, y se revirtió a `false` para dejar el dato de prueba como estaba.
