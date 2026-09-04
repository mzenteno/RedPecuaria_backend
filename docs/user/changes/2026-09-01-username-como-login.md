# 2026-09-01 — `username` reemplaza a email como identificador de login

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- Migración `AddUsernameToUsers1788316775263`: agrega `users.user_name` (`NOT NULL`,
  `UNIQUE`), backfillea el usuario admin ya sembrado con `username = "admin"`, y elimina
  `UQ_users_email` — el email deja de ser único.
- Dominio: `User` gana el campo `username` (validado no-vacío en `create()`, nueva
  `InvalidUsernameException`). Nueva `UsernameAlreadyRegisteredException`, reemplaza a
  `EmailAlreadyRegisteredException` (eliminada — ya no aplica, el email puede repetirse).
  `UserRepository.findByEmail` → `findByUsername`.
- `LoginUseCase`: `LoginInput.email` → `LoginInput.username`, busca por `findByUsername`.
- `RegisterUserUseCase`: agrega `username` al input; valida duplicado de `username` en vez de
  duplicado de email.
- `LoginRequestDto`: `email` (`@IsEmail()`) → `username` (`@IsString()`).
- Verificado con `tsc --noEmit`, `npm run build`, la migración corrida contra la base real, y
  login end-to-end con `username: "admin"` (funciona), con el email viejo como username
  (falla, como corresponde) y con password incorrecto (falla).

## Motivo

Pedido explícito: el login debe ser por `username` + contraseña, y el email debe poder
repetirse (dos personas distintas pueden compartir un email, ej. una cuenta compartida de
área).

## Qué había antes

`email` era el identificador único de login (`UNIQUE(email)`), usado en
`findByEmail`/`EmailAlreadyRegisteredException`. No existía ningún campo `username`.
