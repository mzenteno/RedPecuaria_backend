# Un Super Administrador no necesita ningún `Role` ni ninguna fila en `user_companies`

**Estado:** ✅ implementado, 2026-09-25.

## Cómo se llegó a esto

Surgió de una pregunta directa del usuario, después de proteger contra edición el rol "Super
Administrador" sembrado en la migración inicial (ver
[docs/role/changes/2026-09-25-rol-super-administrador-protegido.md](../../role/changes/2026-09-25-rol-super-administrador-protegido.md),
superado por este mismo documento):

> "¿ahora tu crees que deberíamos tener un rol 'Super Administrador'? yo creo que solo con el
> tipo de usuario debería cargar todo y todos los permisos de las pantallas y borramos el rol"

La respuesta fue sí, tenía razón — y quedó confirmado con evidencia concreta ya presente en el
propio código: `SwitchCompanyUseCase` ya documentaba que un Super Administrador puede "estar
activo" en una empresa donde no tiene ninguna fila en `user_companies` (`roleId: undefined` en
ese caso), y `GetAuthorizedMenuUseCase` ya le daba acceso total a todos los menús a cualquier
Super Administrador sin consultar `role_menu_permissions` en absoluto. El Rol "Super
Administrador" que se acababa de proteger nunca se consultaba para nada — protegerlo era blindar
algo irrelevante, no la solución correcta.

## El bloqueo real: el login exigía una `UserCompany` para CUALQUIER usuario

Antes de este cambio, `LoginUseCase` tiraba `NoActiveUserCompanyException` si el usuario no tenía
ninguna fila activa en `user_companies` — sin excepción, sin mirar el `UserType` para nada (ese
chequeo pasaba primero). Y `user_companies.role_id` es `NOT NULL` en la base — una membresía sin
rol es imposible a nivel de esquema. Esto significaba que, aunque el resto del sistema ya toleraba
un Super Administrador sin rol, **ni siquiera podía loguearse** sin al menos una fila ahí.

## La decisión: reusar el selector de empresa que ya existe, no un default silencioso

Se evaluaron dos caminos para resolver "¿qué `companyId` le pongo en el token a un Super
Administrador que no tiene ninguna fila?": asignarle un default silencioso (la primera empresa
por orden alfabético) o mostrarle el diálogo de selección de empresa que ya existe (hasta ahora
solo se disparaba cuando alguien tenía **varias** membresías propias). El usuario eligió
explícitamente la segunda opción: **"le tiene que salir el diálogo con las empresas y ahí debe
seleccionar"** — sin default oculto, siempre una elección activa.

Esto resultó ser la opción más barata además de la más clara: reusa
`CompanySelectionRequiredException`/`CompanyChoice[]`/`CompanySelectDialog` tal cual ya existían,
sin ningún cambio en el frontend (`useLogin()` ya maneja genéricamente cualquier
`CompanySelectionRequiredException`, sin importar si las opciones son "las empresas propias" o
"todas las empresas del sistema"). Como siempre se resuelve un `companyId` real antes de emitir el
token, **`companyId` nunca deja de ser obligatorio en ningún lado** — no hizo falta tocar los 35
sitios del backend que ya asumen `@CurrentUser('companyId')` como un `string` no-opcional, ni el
esquema de `refresh_tokens` (`company_id NOT NULL`), ni `AuthSession.companyId` del frontend. Solo
`roleId` (que ya era opcional) queda ausente para este caso.

## Qué cambió

**`LoginUseCase`** (`src/application/auth/use-cases/login.use-case.ts`): el `UserType` se resuelve
ANTES del chequeo de `activeUserCompanies.length === 0` (antes se resolvía después, y ese chequeo
tiraba siempre sin excepción). Si es 0 y el usuario ES Super Administrador: sin `companyId` en el
input, tira `CompanySelectionRequiredException` con **todas** las empresas del sistema
(`companyRepository.findAllActive()`, ya viene ordenado alfabéticamente) — no solo sus propias
membresías, porque no tiene ninguna. Con `companyId`, resuelve esa empresa directo (sin pasar por
`UserCompany`), `roleId: undefined`. Si es 0 y NO es Super Administrador: sigue tirando
`NoActiveUserCompanyException`, sin cambios.

**`RegisterUserUseCase`**: si el `UserType` del usuario nuevo es Super Administrador, no valida
`companyId`/`roleId` para nada y no crea ninguna `UserCompany` — solo el `User`. Para cualquier
otro tipo, sigue exactamente igual que antes (ahora con `RoleRequiredException` si falta
`roleId`, que pasó a ser opcional en el input/DTO).

**`ChangeUserTypeUseCase`**: al ASCENDER a alguien a Super Administrador, se le desactivan TODAS
sus membresías activas existentes (no solo la de la empresa de quien hace el cambio) — ya no le
corresponde ninguna. **Límite conocido, no resuelto acá**: este mismo caso de uso sigue sin poder
usarse para cambiar el tipo de alguien que YA es Super Administrador (su chequeo de pertenencia a
empresa nunca matchea, cero membresías) — demoverlo requeriría además asignarle una empresa+rol
nuevos en la misma operación, que hoy no forma parte de este endpoint. Quedó fuera de alcance.

**`UserRepositoryAdapter.findAllPaginated`**: pasó de `innerJoin` a `leftJoin` sobre
`user_companies` — con `innerJoin` puro, un Super Administrador sin ninguna fila ahí quedaba
invisible en CUALQUIER listado de usuarios, de cualquier empresa, sin forma de encontrarlo/editarlo
desde la pantalla de Usuarios. La condición de membresía va en el propio `JOIN` (no en el `WHERE`)
para no duplicar filas; el `WHERE` incluye la fila si tiene membresía activa en la empresa que se
está mirando, **o** si quien mira es Super Administrador y la fila también lo es.

**Migración inicial (`SeedInitialData`) reescrita**: ya no siembra ningún `Role` ni sus
`role_menu_permissions`, ni ninguna fila en `user_companies` para el usuario admin — solo la
empresa "Empresa" (de ejemplo), el catálogo de menús, y el usuario admin en sí (que una migración
posterior, `AddSuperAdminUserType`, ya reclasifica a Super Administrador por su `user_name`, sin
depender de rol ni empresa).

**Se deshizo por completo** (queda sin nada que proteger): `Role.isProtected()`,
`SUPER_ADMIN_ROLE_ID`, `ProtectedRoleException`, y los chequeos que se le habían agregado a
`rename()`/`deactivate()`/`SetRoleMenuPermissionUseCase` — junto con el equivalente en el
frontend (`role-table.tsx` vuelve a mostrar Editar/Eliminar para cualquier rol,
`permissions/page.tsx` vuelve a depender solo de `canEdit`). Si no se sacaba esto, el `id=1`
hubiera quedado libre y el primer Rol que cualquier empresa creara en el futuro habría quedado
"protegido" por casualidad, sin que nadie lo pidiera.

## Verificado

`tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en vivo, a pedido del
usuario (ver memoria del proyecto: no levantar backend/frontend para verificar).
