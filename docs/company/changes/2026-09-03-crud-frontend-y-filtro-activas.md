# 2026-09-03 — CRUD de Empresas en el frontend + filtro por activas

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

**Backend**
- `CompanyRepository.findAll()` → `findAllActive()`: ahora filtra `isActive: true` en la
  query (TypeORM `where`), no después en el caso de uso. `ListCompaniesUseCase` lo usa para
  la rama Super Administrador.
- Migración `AddCompaniesMenuPath`: asigna `path: '/companies'` al menú "Empresas" (antes
  `null`, el sidebar lo mostraba deshabilitado).

**Frontend** — CRUD completo siguiendo la arquitectura ya establecida (domain → application →
infrastructure → hooks → components), analizando primero el CRUD de "Clientes" del proyecto
de referencia para no repetir sus problemas (informe completo en la conversación, resumen
abajo):
- `domain/company/*`, `application/company/*`, `infrastructure/repositories/company/*`,
  `infrastructure/di/company.container.ts`, `hooks/company/use-companies.ts`.
- `components/ui/page-toolbar.tsx` (nuevo, reutilizable — búsqueda + botón "Nuevo").
- `components/company/company-table.tsx`, `company-dialog.tsx` (react-hook-form + zod, no
  validación a mano).
- `app/(main)/companies/page.tsx`.
- `lib/swal.ts` (nuevo): wrapper de SweetAlert2 con `buttonsStyling: false` +
  `customClass` apuntando a `.btn-primary`/`.btn-secondary`/`.btn-danger` — evita el bug que
  tiene la referencia (un botón de error en azul que ni siquiera es su color de marca).
- `.btn-danger` nuevo en `globals.css` + `Button` gana la variante `variant="danger"`.
- **Bug real encontrado y corregido de paso**: el sidebar colapsaba por completo en desktop
  al navegar por un link (`MenuNode` llama a `close()` al hacer click, pensado para cerrar el
  cajón en mobile, pero la clase `lg:w-0` del `<aside>` también lo colapsaba en desktop). Nunca
  se había notado porque "Empresas" es el primer ítem del menú con un `path` real — todos los
  demás son `<span>` deshabilitados sin `onClick`. Corregido en `sidebar.tsx`.

## Decisiones tomadas

- **Sin paginación**: a diferencia de `GET /users` (que sí pagina), "empresas" son inquilinos
  del sistema — se espera un puñado por mucho tiempo. Trae todas las activas, búsqueda en el
  cliente sobre esa lista.
- **"Desactivar", no "eliminar"**: `Company` no tiene soft-delete, solo `isActive`
  (`deactivate()`, sin `reactivate()` todavía) — la tabla no tiene columna "Estado" porque el
  backend ya filtra a solo activas, nunca aparecería un valor distinto de "Activo".

## Problemas encontrados en la referencia (Clientes) que NO se repitieron acá

1. `userId` confiado del cliente (`localStorage` → body del POST, sin derivarlo de un token
   validado). No aplica a `Company` (no tiene ese campo), pero se deja como criterio para
   futuros módulos.
2. Filtro de "eliminados" hecho en el frontend en vez de en la query — corregido acá con
   `findAllActive()`.
3. Colores hardcodeados fuera del sistema de diseño en SweetAlert2 (un botón azul que no es
   el color de marca) — `lib/swal.ts` usa las clases de botón del proyecto.
4. Validación de formulario a mano — se usa react-hook-form + zod, como en el login.

## Verificado

Contra la app real con Playwright: crear, editar, buscar y desactivar una empresa — el 204 del
`deactivate` hace que la fila desaparezca de la lista (4 → 3 registros), confirmando que el
filtro server-side funciona. `tsc --noEmit` y `eslint` sin errores en ambos proyectos.
