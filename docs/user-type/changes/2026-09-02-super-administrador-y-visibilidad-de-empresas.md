# 2026-09-02 — Super Administrador y visibilidad de empresas

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- Migración `AddSuperAdminUserType`: agrega el tercer tipo de usuario "Super Administrador" al
  catálogo (antes solo existían "Administrador" e "Inversionista"). Reclasifica al usuario
  admin sembrado (`username: "admin"`, el único con más de una `UserCompany` activa) de
  "Administrador" a "Super Administrador".
- `UserType` (dominio) gana `isSuperAdmin()` y la constante `SUPER_ADMIN_USER_TYPE_NAME`.
- `UserType` deja de ser puramente informativo: ahora define la **visibilidad de empresas**
  (`GET /companies`). Super Administrador ve todas; Administrador e Inversionista ven solo la
  empresa de su sesión actual.
- `AccessTokenPayload` gana `isSuperAdmin: boolean`, calculado una vez en `LoginUseCase` y
  `RefreshTokenUseCase` (ambos ya cargaban el `User` completo, sin costo extra) — mismo patrón
  que `companyId`/`roleId`, evita que `ListCompaniesUseCase` (módulo `company`) dependa del
  módulo `user` solo para esta decisión.
- `ListCompaniesUseCase` recibe `{ isSuperAdmin, companyId }` y filtra según corresponda.
  `CompanyController.list()` los saca del `@CurrentUser()`.

## Motivo

Pedido explícito: separar un tercer nivel "Super Administrador" con visibilidad global de
empresas, distinto de "Administrador" (que hasta ahora, al ser puramente informativo, no tenía
ningún efecto sobre qué empresas podía ver un usuario — `GET /companies` devolvía siempre el
catálogo completo a cualquier usuario autenticado).

## Qué había antes

`GET /companies` devolvía `companyRepository.findAll()` sin ningún filtro, para cualquier
usuario autenticado. `UserType` no afectaba ningún comportamiento del sistema.

## Verificado

- `tsc --noEmit` y `eslint` sin errores nuevos.
- Contra la app real: Super Administrador (`admin`) ve 2 empresas; Administrador (`jperez`) ve
  1 sola (la de su sesión); el refresh token regenera `isSuperAdmin` correctamente.
