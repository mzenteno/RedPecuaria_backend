# 2026-08-31 — Casos de uso de gestión del vínculo

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregaron `AssignUserToCompanyUseCase`, `ChangeUserCompanyRoleUseCase`,
`DeactivateUserCompanyUseCase` y `ListUserCompaniesByUserUseCase` en
`application/auth/use-cases/`. Fue necesario agregar `UserCompanyNotFoundException` a
`domain/auth/exceptions/` — no existía. `AssignUserToCompanyUseCase` es distinto de
`RegisterUserUseCase` (que crea el `User` desde cero): este solo agrega un vínculo nuevo para
un usuario que ya existe. Registrados en `auth.module.ts`, que ahora importa `UserModule` con
`forwardRef` (dependencia circular real entre `auth` y `user` — ver comentario en
`auth.module.ts`/`user.module.ts`). Sin tests unitarios todavía (a pedido explícito).

## Motivo

Completar la Fase 5 del plan de `user-company` — la parte que no queda cubierta por
`RegisterUserUseCase` (agregar una empresa adicional a un usuario ya existente, cambiar su
rol, o quitarle el acceso).

## Qué había antes

Solo existía el dominio y la persistencia de `UserCompany` (Fase 3), sin ningún caso de uso —
la única forma de crear un vínculo era el seed inicial.
