# 2026-09-04 — "Mis inversiones" reemplaza el selector de Propiedad en Kardex

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- Nuevo `GET /investments/mine` (`ListInvestmentsByInvestorUseCase` +
  `InvestmentRepository.findByInvestor`): las inversiones donde el usuario logueado es
  inversionista, de cualquier propiedad, sin `propertyId` como filtro. `userId` sale siempre de
  `@CurrentUser('sub')`, nunca de un parámetro del cliente.
- `app/(main)/kardex` (frontend) ya no elige "Propiedad" primero — muestra directo una lista
  clickeable ("Mis inversiones") de lo que devuelve `/investments/mine`; clic en una fila entra
  a su kardex. El botón "Ver kardex" de la tabla de Inversiones (`/kardex?propertyId=&investmentId=`)
  sigue funcionando igual, como atajo para quien no es inversionista (ej. un Administrador).

## Motivo

A pedido del usuario: la pantalla de Kardex es, en la práctica, el lugar donde un inversionista
entra a ver sus propias inversiones — no tiene sentido que primero elija una propiedad de un
combobox (que además podría no reconocer, si no administra propiedades) para llegar a algo suyo.
"El primer filtro tienen que ser las inversiones... donde el usuario está" — filtrado por
inversionista, no por propiedad, y como lista clickeable, no como combobox.

## Qué había antes

`app/(main)/kardex` elegía "Propiedad" y luego "Inversión" con dos combobox (mismo patrón que
`app/(main)/investments`), listando todas las inversiones de la propiedad elegida — sin
distinguir si el usuario logueado participaba en ellas o no.
