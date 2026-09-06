# 2026-09-04 — El atajo "Ver kardex" no te "saca" de Inversiones

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Al entrar a `/kardex` por el botón "Ver kardex" de la tabla de Inversiones (URL con
`propertyId`+`investmentId`): el sidebar sigue resaltando "Inversiones" (no "Kardex"), y el
botón "Volver" de la pantalla de Kardex dice "Volver a Inversiones" y navega a `/investments` —
en vez de "Volver a Mis inversiones" (que vacía `investmentId` y muestra la lista de "mis
inversiones"). Entrando directo desde el ítem "Kardex" del sidebar (sin esos query params) el
comportamiento no cambia: se resalta "Kardex" y el botón dice "Volver a Mis inversiones".

Señal usada para distinguir ambos orígenes: presencia de `propertyId` en la URL de `/kardex`
(`sidebar.tsx` lee `useSearchParams()` además de `usePathname()`, un caso especial reconocido a
propósito — es el único lugar donde ese componente, por lo demás genérico, conoce las claves
puntuales `investments`/`kardex`).

De paso, el ícono de "Ver kardex" en `InvestmentTable` pasa de `BookOpen` a `ClipboardList` — el
mismo que ya usa el ítem "Kardex" del sidebar (`menu-icon.tsx`), para que se identifique como la
misma acción en los dos lugares.

**Segunda vuelta del mismo cambio**: "Volver a Inversiones" al principio perdía los filtros
elegidos (Gestión/Propiedad volvían a "Selecciona un valor") — un `router.push` entre rutas
distintas remonta el componente de cero, así que el `useState` local de la pantalla anterior no
sobrevive. Se resolvió llevando esos filtros en la URL: "Ver kardex" ahora manda también
`gestion` (`/kardex?propertyId=&investmentId=&gestion=`), `kardex/page.tsx` lo guarda
(`shortcutGestion`) sin usarlo para nada más que devolverlo en el link de "Volver", y
`investments/page.tsx` inicializa `gestion`/`propertyId` leyendo `useSearchParams()` al montar.

**Tercera vuelta**: entrar a `/kardex` por el atajo y después hacer clic directo en el ítem
"Kardex" del sidebar (`/kardex`, sin query params) dejaba la pantalla mostrando lo mismo de
antes, en vez de reiniciar a "Mis inversiones" — Next no remonta un componente solo porque
cambia el query string de la misma ruta, así que los `useState(() => searchParams.get(...))`
con inicialización perezosa nunca volvían a leer la URL nueva. Se resolvió pasándole
`key={searchParams.toString()}` al contenido de la pantalla, desde el `export default`
(`KardexPage`/`InvestmentsPage`, no el `...Content` de adentro) — fuerza un remount real cada
vez que cambia el query string, reseteando todo el estado local.

## Motivo

A pedido del usuario: entrar al kardex desde Inversiones se sentía como "salir" de la sección
(el sidebar saltaba a "Kardex" y "Volver" te mandaba a una lista distinta, "Mis inversiones",
que no tiene nada que ver con desde dónde habías entrado).

## Qué había antes

El sidebar resaltaba estrictamente por `pathname === node.path` — entrar a `/kardex` por
cualquier camino resaltaba siempre "Kardex", y el botón "Volver" siempre decía "Volver a Mis
inversiones" y vaciaba `investmentId`.
