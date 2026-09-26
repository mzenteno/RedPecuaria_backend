# El rol Super Administrador (id=1) queda protegido

**Estado:** ⚠️ SUPERADO el mismo día — ver
[2026-09-25-super-admin-sin-user-company.md](../../user-company/changes/2026-09-25-super-admin-sin-user-company.md).
Al preguntarle al usuario "¿tiene sentido que exista un Rol 'Super Administrador' del todo?", la
respuesta fue no: un Super Administrador no necesita ningún `Role` (ve todo por su `UserType`) —
se sacó el Rol de la semilla por completo, y con él, la protección que describe este documento
(no queda nada que proteger). Se deja este archivo como quedó, sin reescribirlo, para no perder
el razonamiento de por qué "por id, no por nombre" — ese razonamiento sigue siendo válido en
abstracto, solo que ya no aplica a nada concreto en este proyecto.

## Qué pedía el usuario

El rol sembrado en la migración inicial (`SeedInitialData`) debía llamarse "Super
Administrador", ser siempre el de `id=1`, y no poder editarse — ni renombrarse, ni desactivarse,
ni cambiarle sus permisos por menú. El usuario también pidió explícitamente que la validación
fuera **por id, no por nombre**.

## Lo que encontramos al investigar (distinto de lo que se asumía)

El rol sembrado hoy se llama **"Administrador"**, no "Super Administrador" — y **no existía
ninguna protección todavía**, ni por nombre ni por id: cualquier rol, incluido este, se podía
renombrar/desactivar/cambiar sus permisos sin ninguna restricción (`Role.rename()`/`deactivate()`
no tenían ningún guard). No era "estaba mal validado por nombre" — era que no había ninguna
validación.

## Por qué por id y no por nombre

A diferencia de `UserType` (catálogo cerrado, sin CRUD — ahí sí tiene sentido comparar
`UserType.isSuperAdmin()` contra el nombre exacto "Super Administrador", porque el nombre nunca
cambia por API, ver `docs/user-type/user-type.md`), un `Role` **sí se puede renombrar libremente**
por `PATCH /roles/:id`. Si la protección comparara por nombre, alcanzaría con renombrar el rol
protegido a otra cosa para dejarlo editable, o renombrar cualquier OTRO rol a "Super
Administrador" para que quedara (incorrectamente) protegido. El `id`, en cambio, nunca cambia —
es la única comparación que no se puede esquivar.

## Qué cambió

- **`Role` (dominio, `src/domain/auth/entities/role.ts`)**: nueva constante
  `SUPER_ADMIN_ROLE_ID = '1'` y método `isProtected()` (compara contra el `id` privado, no el
  getter público — un `Role` recién creado, sin persistir, nunca es el protegido). `rename()` y
  `deactivate()` tiran `ProtectedRoleException` si `isProtected()`.
- **`SetRoleMenuPermissionUseCase`**: no pasa por ningún método de `Role` (opera sobre
  `RoleMenuPermission`, otra entidad) — se le agregó el mismo chequeo aparte, justo después de
  resolver el rol.
- **Nueva excepción** `ProtectedRoleException` (`FORBIDDEN`) —
  `src/domain/auth/exceptions/protected-role.exception.ts`.
- **`SeedInitialData` (la migración inicial) editada directo**: el rol que siembra pasa a
  llamarse "Super Administrador" desde el vamos (`ROLE_NAME`, antes "Administrador") — a pedido
  del usuario, que va a correr todas las migraciones de cero contra una base en blanco, así que
  no hace falta una migración de dato aparte para corregir bases ya existentes (esa fue la
  primera versión de este cambio, se descartó por innecesaria en este escenario).
- **Frontend**: `role-table.tsx` no muestra los botones Editar/Eliminar para la fila con
  `id === SUPER_ADMIN_ROLE_ID` (nueva constante en `domain/role/role.entity.ts`);
  `permissions/page.tsx` pone la matriz de permisos en solo lectura cuando el rol elegido es
  ese. Es solo UX (evita el 403 inevitable) — la protección real la impone el backend.

## Por qué no afecta el acceso real de un Super Administrador

El frontend ya resuelve los permisos de un usuario Super Administrador (tipo de USUARIO, ver
`docs/user-type/user-type.md`) con `applySuperAdminOverride()` — le da acceso total a todos los
menús sin mirar `role_menu_permissions` en absoluto. Congelar los permisos de ESTE rol puntual no
le quita ni le agrega nada a un usuario de tipo Super Administrador: son dos mecanismos
independientes (`UserType.isSuperAdmin()` para el usuario, `Role.isProtected()` para este rol
puntual).

Verificado con `tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en
vivo, a pedido del usuario (ver memoria del proyecto: no levantar backend/frontend para
verificar).
