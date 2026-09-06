# 2026-09-04 — `username`/`fullName` en el access token

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

`AccessTokenPayload` gana dos campos, copiados del `User` al emitir el token en los 3 lugares
donde se genera (`LoginUseCase`, `RefreshTokenUseCase`, `SwitchCompanyUseCase`): `username`
(identificador de login, `User.username`) y `fullName` (nombre real de la persona). En el
frontend, el menú del usuario en el `TopBar` muestra `username` como título y el email debajo,
en vez de mostrar el email como "nombre" y una etiqueta de rol genérica ("Super
Administrador"/"Usuario") debajo.

## Motivo

A pedido del usuario, tras notar que el menú del `TopBar` mostraba el email en el lugar del
nombre. Primer intento: mostrar `fullName` (el nombre real) — el usuario aclaró que en realidad
quería ver el `username` (con el que se loguea), no el nombre completo de la persona.

## Qué había antes

`AccessTokenPayload` solo tenía `sub`, `companyId`, `roleId`, `email`, `isSuperAdmin`. El
frontend mostraba el email como "nombre" y una etiqueta de rol (`isSuperAdmin ? 'Super
Administrador' : 'Usuario'`) debajo, por no tener ni el username ni el nombre real disponibles
en el token.
