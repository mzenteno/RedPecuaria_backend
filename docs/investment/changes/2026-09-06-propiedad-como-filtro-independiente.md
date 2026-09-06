# 2026-09-06 — "Propiedad" también dispara la consulta, y los 3 filtros se pueden limpiar

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **Nuevo `GET /investments/by-property?propertyId=&page=&pageSize=&gestion=&investorUserId=&search=`**
  (`ListInvestmentsByPropertyPaginatedUseCase` + `InvestmentRepository.findActiveByPropertyPaginated`,
  ambos nuevos) — "Propiedad" ahora también puede ser el único filtro elegido y disparar la
  consulta por sí sola, paginado en el servidor, con `gestion`/`investorUserId` como filtros
  opcionales adicionales (mismo criterio que `by-gestion`/`by-investor`). Distinto de
  `GET /investments?propertyId=` (sin paginar, sigue existiendo tal cual — lo usa el atajo "Ver
  kardex").
- **`app/(main)/investments`**: los tres filtros (Gestión, Propiedad, Inversionista) son ahora
  formas **independientes** de disparar la consulta — antes solo Gestión e Inversionista podían
  ser el "modo activo"; elegir solo Propiedad no mostraba nada. `activeMode` pasa de
  `'gestion' | 'investor' | null` a `'gestion' | 'investor' | 'property' | null`, con prioridad
  Gestión > Inversionista > Propiedad cuando hay más de uno elegido.
- **`components/ui/select.tsx`: nueva prop `onClear`** — agrega un botón "×" que solo se
  muestra cuando el combo ya tiene un valor elegido, y lo vuelve a "sin elegir". Se pasa en los
  tres filtros de Inversiones (`handleGestionChange('')`, `handlePropertyChange(null)`,
  `handleInvestorChange(null)`) — un campo obligatorio de un diálogo de alta/edición
  simplemente no recibe esta prop.

## Motivo

El usuario reportó, mirando la pantalla: "veo q propiedad no tiene el evento q carga datos, yo
puedo elegir cualquier combo para filtrar y además debería ser capaz de borrar el valor para
que vuelva a quedar vacío y no tome en cuenta ese combo". Dos problemas reales, confirmados
revisando el código:
1. `activeMode` solo consideraba `gestion`/`investorUserId` — "Propiedad" nunca disparaba la
   consulta por sí sola (aunque sí funcionaba como filtro adicional una vez que Gestión o
   Inversionista ya estaban elegidos).
2. La opción placeholder de `Select` es `disabled hidden` (a propósito, ver la regla de "ningún
   combo con opción Todos/Todas") — eso significa que, una vez elegido un valor real, no hay
   forma nativa de volver a ella desde el `<select>` abierto: ningún filtro de la pantalla se
   podía "deshacer" sin recargar la página.

## Decisiones de diseño

- **Endpoint nuevo (`by-property`), no reutilizar `by-gestion`/`by-investor` haciendo
  `gestion`/`investorUserId` condicionalmente requeridos**: esos dos DTOs ya tienen su campo
  principal como obligatorio (es lo que define su identidad — "por gestión", "por
  inversionista") — forzar una validación de "al menos uno de gestion/propertyId" ahí habría
  sido más confuso que agregar un tercer endpoint hermano, mismo patrón que los otros dos.
- **`onClear` como botón "×" externo, no reintroducir una opción "Todos" en la lista**: la regla
  de "ningún combo ofrece Todos/Todas" sigue vigente — el botón no es un renglón más del combo,
  es una forma de deshacer la elección desde afuera de la lista desplegable.
- **Prioridad Gestión > Inversionista > Propiedad** (no un orden distinto): es la misma
  prioridad que ya existía entre Gestión e Inversionista antes de este cambio — agregar
  Propiedad como tercera opción, al final de esa prioridad, no cambia el comportamiento ya
  verificado de las combinaciones existentes (Gestión+Propiedad, Gestión+Inversionista,
  Inversionista+Propiedad ya funcionaban bien vía "Propiedad" como filtro extra).

## Qué había antes

Solo "Gestión" e "Inversionista" podían disparar la consulta (`activeMode: 'gestion' |
'investor' | null`) — elegir únicamente "Propiedad" no mostraba ningún resultado, aunque el
combo aceptaba la selección. Ningún combo de la pantalla (ni de ninguna otra pantalla del
proyecto) tenía forma de volver a "sin elegir" una vez elegido un valor real.
