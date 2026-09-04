# 2026-09-04 — Cambiar tipo/rol desde la pantalla de Usuarios + scoping por empresa

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- `ChangeUserCompanyRoleUseCase` y `ChangeUserTypeUseCase` ahora reciben `companyId` (de
  `@CurrentUser('companyId')`) y validan que el usuario/vínculo objetivo pertenezca a la
  empresa activa de quien hace el cambio — antes ninguno de los dos lo validaba:
  - `ChangeUserCompanyRoleUseCase` dejaba reasignar el rol de un vínculo de **otra** empresa
    adivinando su id.
  - `ChangeUserTypeUseCase` dejaba cambiar el `UserType` (incluso a "Super Administrador") de
    **cualquier** usuario del sistema, sin importar si pertenecía a la empresa de quien hacía
    el cambio — el más serio de los dos, porque es una escalada de privilegio directa.
- `GetUserRoleInCompanyUseCase` (nuevo) — da el vínculo (`id` + `roleId`) de un usuario en la
  empresa activa de quien pregunta. `GET /users/:userId/role` (nuevo, en
  `UserCompanyController`).
- El diálogo de edición de la pantalla de Usuarios (frontend) ahora incluye "Tipo de usuario"
  y "Rol" como campos editables — antes solo dejaba tocar `email`/`fullName`, aunque los
  endpoints para cambiar tipo y rol ya existían desde antes, simplemente no estaban
  conectados a ninguna pantalla.
- `UserTable` ahora muestra la columna "Tipo de usuario".

## Motivo

Se encontraron los dos huecos al conectar por primera vez estos endpoints a una pantalla real
— hasta ahora nadie los llamaba desde el frontend, así que el problema estaba "latente" pero
no había manera de explotarlo salvo llamando a la API a mano. Se corrige antes de exponerlo en
la UI, mismo criterio que el resto de los huecos de scoping por empresa encontrados esta
semana (`Role`, `Permission`).

## Qué había antes

`PATCH /user-companies/:id/role` y `PATCH /users/:id/user-type` no validaban ninguna
pertenencia a empresa. No existía forma de consultar "qué rol tiene hoy este usuario en mi
empresa" sin traer *todas* las empresas del usuario (`GET /users/:userId/companies`, que
tampoco filtra por empresa — sigue así, es un caso de uso distinto, pensado para gestión
cross-empresa de un Super Administrador). El diálogo de edición de Usuarios solo permitía
`email`/`fullName`.
