# 2026-09-04 — Grupo "Inversiones" + permiso propio de Kardex

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- Nuevo menú padre `investment-management` ("Inversiones", raíz, `order: 2`). Se reparentaron
  `properties` e `investments` debajo (antes colgaban de `administration`).
- Columna nueva `menus.show_in_sidebar` (`boolean`, default `true` — ningún menú existente
  cambia de comportamiento). Nuevo menú `kardex` ("Kardex", `path: /investments/:id/kardex`,
  hijo de `investments`, `show_in_sidebar: false`): existe solo para tener su propio
  `canView/canCreate/canEdit/canDelete`, independiente de `investments`.
- `role_menu_permissions` de `kardex` se copiaron 1 a 1 de los que cada rol ya tenía en
  `investments`, para no cambiar el acceso de nadie hasta que se ajuste a mano.
- `GetMenuUseCaseImpl` (frontend) excluye del árbol cualquier ítem con `show_in_sidebar: false`
  antes de armar los nodos — no solo no se muestra, tampoco cuenta como "hijo" de su padre.

## Motivo

A pedido del usuario: agrupar "Propiedades" e "Inversiones" bajo un módulo de negocio propio
(hoy compartían el grupo "Administración", que es la sección de plataforma), y separar el
permiso del Kardex del de Inversión — hoy ambas pantallas comparten `menuKey: 'investments'`,
lo que impedía dar "puede crear inversiones pero no tocar el kardex" (o viceversa) a un rol.

## Decisión de diseño: por qué `show_in_sidebar` y no simplemente anidar `kardex` bajo `investments`

El Kardex es un drill-down de una inversión puntual, no una pantalla a la que se navegue desde
el sidebar. Colgarlo como hijo de `investments` en el árbol sin este flag rompía la navegación:
`sidebar.tsx` (frontend) convierte cualquier nodo con hijos en un botón colapsable en vez de un
link — "Inversiones" hubiera dejado de navegar directo a su propio CRUD y se hubiera vuelto una
carpeta con un ítem "Kardex" adentro (deshabilitado, porque además no tiene una ruta genérica
sin el id de la inversión). `show_in_sidebar: false` deja a `kardex` fuera del árbol por
completo, pero sigue siendo un `menuKey` real para `usePermission`/`RequirePermission` (la
consulta del frontend, `getMenuItemsUseCase`, trae el catálogo plano sin filtrar) y una fila
normal en la matriz de Permisos (`path` no es `null`, así que no lo excluye el filtro de esa
pantalla).

## Qué había antes

`properties` e `investments` colgaban de `administration`. El Kardex no tenía menú propio —
reusaba `menuKey: 'investments'` en ambas pantallas (`/investments` y
`/investments/[id]/kardex`).
