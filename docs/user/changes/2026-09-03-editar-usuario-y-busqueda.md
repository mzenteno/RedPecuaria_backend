# 2026-09-03 — Editar usuario, búsqueda de servidor y filtro de dados de baja

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se completa el CRUD de `User` para poder construir la pantalla `app/(main)/users` del
frontend (mismo patrón que "Empresas"):

- `PATCH /users/:id` (nuevo) — `UpdateUserUseCase` + `User.updateProfile(email, fullName)`. A
  propósito solo esos dos campos: `username` es el identificador de login (no se reasigna acá),
  la contraseña no tiene todavía un flujo de reset, y empresa/rol/tipo de usuario ya tienen sus
  propias acciones (`ChangeUserTypeUseCase`, y la asignación de empresa vive en `UserCompany`).
- `GET /users` ahora filtra `is_deleted = false` — antes `findAllPaginated` no filtraba nada y
  el listado mostraba usuarios desactivados mezclados con los activos (mismo criterio que
  `ListCompaniesUseCase`, no había ninguna razón para que difieran).
- `GET /users?search=` (nuevo) — `ILIKE` sobre `username`, `email` y `fullName` combinado con
  el filtro anterior. Necesario porque el listado pagina en el servidor: un cuadro de búsqueda
  que solo filtrara la página ya descargada (como hace "Empresas", que no pagina en servidor)
  sería engañoso acá. `PaginationParams` (dominio compartido) gana un campo `search?: string`
  opcional, reusable por cualquier otro listado paginado futuro.
- `@MaxLength(255)` agregado a `username`/`email`/`fullName` en los DTOs de alta y edición —
  mismo gap que se había detectado en la auditoría de "Empresas" (`varchar(255)` en la columna,
  sin tope del lado de la validación), corregido acá desde el principio en vez de repetirlo.
- Migración `AddUsersMenuPath` — le asigna `path: '/users'` al menú "Usuarios" (antes
  `path: null`, el sidebar lo mostraba sin poder navegar), mismo caso que
  `AddCompaniesMenuPath`.

## Motivo

Construir la pantalla de Usuarios siguiendo el mismo patrón ya establecido con "Empresas",
pero con paginación real de servidor (pedido explícito, a diferencia de "Empresas" que pagina
en el cliente) — eso exige que la búsqueda también viaje al servidor, y de paso se cierra el
filtro de dados de baja que faltaba y el `@MaxLength` que ya se sabía que faltaba.

## Qué había antes

Solo existían `RegisterUserUseCase` (alta), `DeactivateUserUseCase`, `ChangeUserTypeUseCase` y
`ListUsersUseCase` (sin filtro de activos ni búsqueda) — no había forma de editar el perfil de
un usuario ya creado.
