# 2026-08-31 — Fase 6: casos de uso CRUD de roles

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregaron los 4 casos de uso de `role` en `application/auth/use-cases/`: `CreateRoleUseCase`,
`UpdateRoleUseCase`, `DeactivateRoleUseCase`, `ListRolesByCompanyUseCase`, cada uno con su test
unitario (TDD: test primero, mockeando `RoleRepository`/`CompanyRepository`, sin Nest ni base de
datos). Se agregó `InvalidRoleNameException` y se conectó a `Role.create()`/`rename()` para que
la entidad rechace un nombre vacío. Se registraron los casos de uso en `auth.module.ts`
(que ahora importa `CompanyModule` para poder inyectar `CompanyRepository`). Se agregó
`moduleNameMapper` a la config de Jest en `package.json` — era necesario para que los tests
puedan resolver los alias `@domain/*`/`@application/*`/`@infrastructure/*` (no existía ningún
`.spec.ts` en el proyecto hasta ahora). Verificado con `tsc --noEmit`, `npm run build` y
`npx jest` (13 tests, todos en verde).

Queda **pendiente** el `RoleController` (HTTP) — no se expone todavía porque no hay guard de
autorización (`auth-sessions` Fase 8-9 sigue sin implementarse).

## Motivo

Fase 6 del plan de `auth` (CRUD de roles), primera implementación completa del patrón
Application (casos de uso) de la arquitectura DDD/hexagonal del proyecto.

## Qué había antes

Solo existía el dominio y la persistencia de `Role` (Fase 3): entidad, puerto de repositorio y
adaptador TypeORM, sin ningún caso de uso ni test en todo el proyecto.
