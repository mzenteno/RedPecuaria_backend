# 2026-09-06 — "Nueva inversión" ya no depende de ningún filtro elegido

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`InvestmentDialog` tiene su propio combobox de "Propiedad"** (además de "Gestión" y el
  checklist de Inversionistas) — antes no existía, el diálogo dependía 100% de que
  `app/(main)/investments` ya tuviera una Propiedad elegida en su combo de **filtro**. Al
  editar, ese mismo combo se muestra pero `disabled` (mismo criterio que `username` en
  `UserDialog`): `UpdateInvestmentData` no acepta cambiar la propiedad de una inversión ya
  creada, solo tiene sentido en el alta.
- **El botón "Nueva inversión" es siempre visible** (con permiso `canCreate`), sin importar
  `activeMode` ni ningún filtro elegido — se movió de adentro de `PageToolbar` (que solo
  aparecía junto con la tabla, condicionado a `activeMode`) a su propia fila, arriba de los 3
  combos de filtro, en el mismo `.card` pero fuera de esa condición.
- `onSave` de `InvestmentDialog` ahora manda `propertyId` como parte de sus datos (elegido
  dentro del propio diálogo) — `handleSave` en `investments/page.tsx` ya no lee el `propertyId`
  del estado de filtro de la página para armar el alta.

## Motivo

El usuario reportó, viendo la pantalla sin ningún filtro elegido: "no se muestra el botón nuevo
y yo tengo los permisos en el rol". Encontrado el porqué: `onNew={canCreate && propertyId ? ...
: undefined}` — el botón necesitaba, además del permiso, que la página ya tuviera una Propiedad
elegida en su filtro. El usuario aclaró la corrección real: "no importa si no tengo ningún
combo seleccionado igual puedo crear una inversión" — no debía depender de ningún filtro.

## Decisiones de diseño

- **El combo de Propiedad vive en el diálogo, no se reutiliza el de la página**: son
  conceptualmente distintos — el de la página es un **filtro** sobre una lista que ya existe
  (puede estar vacío, "sin filtro"), el del diálogo es un dato **obligatorio** para crear un
  registro nuevo (siempre hace falta elegir uno, sin opción de dejarlo vacío). Mezclarlos era
  la raíz del problema: atarle una decisión de negocio (qué propiedad tiene la inversión nueva)
  al estado de un filtro opcional de otra parte de la pantalla.
- **El botón se separó de `PageToolbar`** en vez de agregarle a ese componente una forma de
  mostrarse "siempre": `PageToolbar` significa "toolbar de una tabla que ya se está mostrando"
  (buscador + acción sobre esa lista) — mostrarlo sin tabla debajo (sin buscador con sentido)
  habría sido más confuso que darle al botón su propia fila, siempre visible.

## Qué había antes

`onNew={canCreate && propertyId ? openCreate : undefined}`, dentro de `PageToolbar`, que en sí
mismo solo se renderizaba cuando `activeMode` era verdadero (alguno de los 3 filtros elegido).
Con ningún filtro elegido, o con Gestión/Inversionista elegidos pero sin Propiedad, el botón
"Nueva inversión" no aparecía en ningún lado de la pantalla, aunque el rol tuviera el permiso
`canCreate`. El diálogo de alta no tenía ningún campo de Propiedad — recibía el `propertyId` ya
resuelto desde la página.

## Continuación — precargar la Propiedad del filtro en el alta

El usuario notó que, si ya tenía una Propiedad elegida en el filtro de la página, era molesto
tener que elegirla de nuevo en el diálogo de alta. Se agregó `defaultPropertyId` (prop nueva de
`InvestmentDialog`, la página le pasa su `propertyId` de filtro actual) — si viene con un
valor, precarga el combo de Propiedad del diálogo con ese mismo valor (sigue siendo editable,
no un valor fijo; sin filtro elegido, el combo arranca vacío como antes). Verificado con
Playwright: con "Azucaro" elegido como filtro, abrir "Nueva inversión" muestra "Azucaro" ya
seleccionado en el combo del diálogo.
