# 2026-09-06 — La propiedad de una inversión se puede cambiar al editar

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`Investment.propertyId` deja de ser `readonly`** (`domain/investment/entities/investment.ts`)
  — pasa a ser un campo privado (`_propertyId`) con getter, mutable a través de
  `Investment.update()`, que ahora también recibe `propertyId` (antes solo `gestion`/
  `description`).
- **`UpdateInvestmentUseCase`** recibe `propertyId` en su input — si viene distinto al actual,
  valida que la propiedad nueva exista y sea de la empresa activa
  (`PropertyNotFoundException` si no), mismo chequeo que ya hacía `CreateInvestmentUseCase`.
- **`UpdateInvestmentRequestDto`** agrega `propertyId` (obligatorio, `IsString`/`MinLength(1)`).
- **`InvestmentDialog` (frontend)**: el combobox de Propiedad ya no se deshabilita al editar —
  es editable en los dos modos (alta y edición). `UpdateInvestmentData` agrega `propertyId`.
- `investments/page.tsx`: `handleSave` ya no separa `propertyId` del resto de los campos al
  editar (antes lo descartaba a propósito) — se manda tal cual viene del diálogo, para los dos
  modos.

## Motivo

Al implementar "Nueva inversión ya no depende de ningún filtro" (ver el change anterior del
mismo día), se deshabilitó el combo de Propiedad al editar, asumiendo el mismo criterio que
`username` en `UserDialog` (un identificador que no se puede tocar una vez creado). El usuario
corrigió esa suposición: la propiedad de una inversión sí se puede cambiar — no hay ninguna
regla de negocio real que lo impida, a diferencia de un identificador de login.

## Decisiones de diseño

- **Validación de la propiedad nueva, no solo de la actual**: `UpdateInvestmentUseCase` ya
  validaba que la propiedad **actual** de la inversión fuera de la empresa activa (chequeo de
  autorización, para poder tocar la inversión en primer lugar). Se agregó un chequeo aparte
  para la propiedad **nueva** (solo si cambió) — sin esto, se podría "mudar" una inversión a una
  propiedad de otra empresa con solo adivinar su id.
- **`Investment.propertyId` pasa a mutable sin ninguna otra restricción**: no hay historial de
  "propiedades anteriores" ni ninguna regla sobre cuántas veces se puede mudar — es un campo
  más, igual que `gestion`/`description`.

## Qué había antes

`Investment.propertyId` era `public readonly` — no había ningún método para cambiarlo después de
`Investment.create()`. `UpdateInvestmentUseCase` no aceptaba `propertyId` en su input.
`InvestmentDialog` mostraba el combo de Propiedad `disabled` en modo edición. Verificado en vivo
contra `RedPecuariaTest`: se movió una inversión real de una propiedad a otra (creada
temporalmente para la prueba) y de vuelta, y se confirmó que mover a un id de propiedad
inexistente devuelve `404 PropertyNotFoundException`.
