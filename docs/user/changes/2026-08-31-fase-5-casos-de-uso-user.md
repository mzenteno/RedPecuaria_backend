# 2026-08-31 — Fase 5: casos de uso de registro de usuarios

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `RegisterUserUseCase` en `application/user/use-cases/`, que crea `User` +
`UserCompany` en una sola transacción (`TransactionManager`, ver ARCHITECTURE.md §7),
validando email libre, `UserType` existente, `Company` existente y `Role` existente **y
perteneciente a esa empresa**, y hasheando la contraseña con `PasswordHasher`. También
`DeactivateUserUseCase` y `ChangeUserTypeUseCase`. `user.module.ts` ahora importa
`CompanyModule` y `AuthModule` (este último con `forwardRef`, porque `auth.module.ts`
también necesita `UserRepository` de este módulo — dependencia circular real entre `user` y
`auth`). Sin tests unitarios todavía (a pedido explícito).

## Motivo

Fase 5 del plan de `user` — el primer caso real de escritura transaccional multi-entidad del
proyecto.

## Qué había antes

Solo existía el dominio y la persistencia de `User`/`UserType` (Fase 3), sin ningún caso de
uso ni forma de crear un usuario más allá del seed inicial.
