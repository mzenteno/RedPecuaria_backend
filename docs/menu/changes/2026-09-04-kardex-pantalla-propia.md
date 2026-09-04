# 2026-09-04 — Kardex pasa a ser pantalla propia del sidebar

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- `FixKardexMenuOrder`: corrige el `order` de `kardex` de `1` a `7`. Se había puesto `1`
  pensando en "orden entre hermanos" (único hijo de `investments`), pero la pantalla de
  Permisos usa ese mismo campo como orden **global** de toda su tabla — `1` chocaba con
  `companies` (también `order: 1`), así que "Kardex" aparecía salteado cerca de "Empresas" en
  vez de al lado de "Inversiones".
- `MakeKardexOwnSidebarEntry`: `kardex` deja de ser un menú invisible (`show_in_sidebar: false`,
  colgado de `investments`) y pasa a ser una pantalla real — `show_in_sidebar: true`, `path`
  cambia de `/investments/:id/kardex` (ruta dinámica) a `/kardex` (ruta fija), y se reparenta
  para ser **hermano** de `properties`/`investments` bajo "Inversiones" (no más hijo de
  `investments`, ya no hace falta ese nivel extra ahora que tiene su propia entrada de
  navegación).
- Frontend: `app/(main)/kardex` reemplaza a `app/(main)/investments/[id]/kardex` — combobox de
  Propiedad + Inversión propios (el segundo depende del primero) en vez de depender de un `:id`
  en la URL. El botón "Ver kardex" de la tabla de Inversiones sigue existiendo como atajo
  (`/kardex?propertyId=&investmentId=` para preseleccionar los combobox), gateado por el
  permiso `canView` de `kardex`.

## Motivo

A los 10 minutos de haber separado el permiso de Kardex del de Inversión (ver el cambio
anterior), el usuario aclaró que la necesidad real era más fuerte que solo un permiso
independiente: "necesito q el kardex sea un menu separado de inversiones". Repensado: un rol
que solo puede hacer kardex, sin acceso al CRUD de Inversiones, no tenía ninguna forma de
**llegar** a la pantalla (el único botón de entrada vivía dentro de la tabla de Inversiones,
que ese rol no puede ver). Con Kardex como pantalla propia del sidebar, ese rol entra
directamente y elige Propiedad + Inversión con sus propios combobox.

## Qué había antes

`kardex` era un menú con `show_in_sidebar: false`, colgado de `investments`, alcanzable solo
desde el botón "Ver kardex" de la tabla de Inversiones (`/investments/:id/kardex`).
