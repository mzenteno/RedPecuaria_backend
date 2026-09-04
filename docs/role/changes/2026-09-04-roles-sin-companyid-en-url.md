# 2026-09-04 — CRUD de Roles (frontend) + Roles sin `companyId` en la URL

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- `POST /companies/:companyId/roles` → `POST /roles`, `GET /companies/:companyId/roles` →
  `GET /roles`. En los dos, `companyId` ahora sale de `@CurrentUser('companyId')` (la empresa
  activa de la sesión), nunca de un parámetro de la URL que el cliente podía cambiar a mano —
  mismo hueco y misma corrección que ya se había hecho en `UserController`
  (`POST/GET /users`).
- `@MaxLength(255)` agregado a `name` en `CreateRoleRequestDto`/`UpdateRoleRequestDto` —
  mismo criterio ya aplicado en Empresas y Usuarios (la columna es `varchar(255)`, sin tope
  del lado de la validación un nombre más largo explotaba como 500 en vez de un 400 limpio).
- Migración `AddRolesMenuPath` — el ítem "Roles" del sidebar ya es un link real
  (`/roles`), corrida contra la base real y contra `RedPecuariaTest`.
- Pantalla `app/(main)/roles` (frontend) — mismo patrón que "Empresas": paginación de
  cliente, un solo campo (`name`), confirmación genérica de eliminar, permisos vía
  `usePermission('roles')`/`RequirePermission`.

## Motivo

Construir la pantalla de Roles siguiendo el mismo patrón ya establecido, y de paso cerrar el
mismo hueco de autorización que ya se había encontrado y corregido en Usuarios — no tenía
sentido dejarlo sin corregir en Roles justo cuando se está construyendo su pantalla.

## Qué había antes

`POST/GET /companies/:companyId/roles` aceptaban cualquier `companyId` en la URL sin
validar que perteneciera a la sesión actual. No existía pantalla de Roles en el frontend.
