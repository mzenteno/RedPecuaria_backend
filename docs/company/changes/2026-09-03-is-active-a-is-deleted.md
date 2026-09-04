# 2026-09-03 — `is_active` → `is_deleted` en las 7 tablas con baja lógica

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

El campo de baja lógica se llamaba `is_active` en las 7 tablas que lo tienen: `companies`,
`users`, `roles`, `user_companies`, `menus`, `role_menu_permissions`, `user_types`. Se
renombró a `is_deleted`, con la **polaridad invertida** (antes `true` = activo/normal y
`false` = desactivado; ahora `false` = normal y `true` = dado de baja):

- **Migraciones**: `InitialSchema` y `AddUserType` (las que originalmente crean estas
  columnas) se reescribieron para declarar `is_deleted boolean NOT NULL DEFAULT false` desde
  el arranque — el proyecto todavía no se desplegó en ningún lado más que este entorno de
  desarrollo compartido, así que no hace falta una migración de corrección aparte.
- **Base de datos actual**: se sincronizó a mano (`ALTER TABLE ... RENAME COLUMN` +
  `UPDATE ... SET is_deleted = NOT is_deleted` + `ALTER COLUMN ... SET DEFAULT false` por
  cada una de las 7 tablas) para no perder los datos ya cargados.
- **Dominio**: las 7 entidades (`Company`, `User`, `Role`, `UserCompany`, `Menu`,
  `RoleMenuPermission`, `UserType`) — su propiedad/getter pasó de `isActive` a `isDeleted`,
  con la lógica invertida en `create()` (arranca en `false`, no en `true`).
- **`deactivate()` se mantiene** como nombre del método de dominio y como verbo de negocio
  en toda la API/UI ("Desactivar") — lo único que cambió es el nombre del campo persistido,
  no el vocabulario de la acción. Internamente ahora hace `this._isDeleted = true` en vez de
  `this._isActive = false`.
- **Infraestructura**: entidades TypeORM (`@Column({ name: 'is_deleted' })`), repositorios
  (`findAllActive`/`findActiveByCompany`/`findActiveByUserId` ahora consultan
  `isDeleted: false`), mappers y DTOs de respuesta HTTP (`isActive` → `isDeleted` en las
  respuestas de `companies`, `users`, `roles`, `user-companies`, `role-menu-permissions`,
  `user-types`).
- **Dos chequeos de negocio con lógica invertida** (no solo renombrados):
  `LoginUseCase` (`if (!user || user.isDeleted)`, antes `!user.isActive`) y
  `RefreshTokenUseCase` (`if (!userCompany || userCompany.isDeleted)`, antes
  `!userCompany.isActive`).
- **Frontend**: `domain/company/company.entity.ts` — `Company.isActive` → `isDeleted` (no se
  muestra en ninguna pantalla todavía, cambio solo de tipado).

## Motivo

`is_active` no es el nombre correcto para un campo de borrado lógico — la convención más clara
es que el campo diga explícitamente qué representa (`is_deleted`), con `false` como el estado
normal.

## Verificado

Con la app real: login de `admin` (Super Administrador) y `jperez` (Administrador) sin
errores, `GET /companies` devuelve `isDeleted` correctamente para ambos casos (todas las
activas vs. solo la propia), `GET /me/menu` sin errores. `tsc --noEmit` y `eslint` sin errores
nuevos en backend y frontend.
