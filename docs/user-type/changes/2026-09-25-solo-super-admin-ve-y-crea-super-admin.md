# Solo un Super Administrador ve y crea usuarios Super Administrador

**Estado:** ✅ implementado, 2026-09-25.

## Qué pedía el usuario

En la pantalla de Usuarios, cualquiera con permiso de ver/crear usuarios podía ver las filas de
tipo "Super Administrador" en el listado, y crear (o ascender, vía "Cambiar tipo de usuario") un
usuario nuevo a ese tipo. El usuario pidió cerrar las dos cosas: **ver** y **crear** quedan
restringidas a quien ya es Super Administrador.

## Por qué no hay un guard/decorador nuevo

No existe en el proyecto ningún guard o decorador genérico de autorización por rol —
`isSuperAdmin` siempre viaja como un `boolean` plano en el JWT (`AccessTokenPayload`, calculado
una sola vez al login, ver `docs/user-type/user-type.md`) y cada regla que lo necesita lo recibe
como input y lo resuelve adentro del propio caso de uso. Este cambio sigue el mismo criterio, sin
introducir ningún mecanismo nuevo — mirando los dos precedentes que ya existían:

- **Para "ver" (filtrar un listado)**: igual patrón que `ListKardexEntriesByInvestmentUseCase`
  (un inversionista no ve las ventas de otros inversionistas) — un booleano del caso de uso se
  traduce a un filtro de `WHERE` en el repositorio.
- **Para "crear" (rechazar una acción)**: igual patrón que `SwitchCompanyUseCase` (solo un Super
  Administrador puede cambiar de empresa activa) — el caso de uso tira una `DomainException` con
  código `FORBIDDEN` si la condición no se cumple.

## Qué cambió

**Ver — `GET /users`:**
- `ListUsersParams` (dominio): `+ excludeSuperAdmins: boolean`.
- `UserRepositoryAdapter.findAllPaginated`: si `excludeSuperAdmins`, agrega
  `AND userType.name != 'Super Administrador'` (reusa el `leftJoin` a `user_types` que ya existía
  para resolver `userTypeName`).
- `ListUsersUseCase`: nuevo input `viewerIsSuperAdmin` (viene de
  `@CurrentUser('isSuperAdmin')`), lo traduce a `excludeSuperAdmins: !viewerIsSuperAdmin`.
- `UserController.list()`: agrega `@CurrentUser('isSuperAdmin')`.

**Crear — `POST /users` y `PATCH /users/:id/user-type`:**
- Nueva excepción `SuperAdminUserTypeForbiddenException` (`FORBIDDEN`) —
  `src/domain/user/exceptions/super-admin-user-type-forbidden.exception.ts`.
- `RegisterUserUseCase`: nuevo input `callerIsSuperAdmin`. Ya resolvía el `UserType` completo
  para validar que exista — se le agrega: si `userType.isSuperAdmin() && !callerIsSuperAdmin`,
  tira la excepción nueva.
- **`ChangeUserTypeUseCase` (`PATCH /users/:id/user-type`) recibe el mismo cierre**, aunque el
  pedido solo mencionaba "crear": sin esto, alguien podía esquivar la regla creando un
  Administrador y después ascendiéndolo a Super Administrador desde la edición. Mismo input
  (`callerIsSuperAdmin`), misma excepción.
- `UserController.register()`/`changeUserType()`: agregan `@CurrentUser('isSuperAdmin')`.

**Frontend (`UserDialog`):** el combo "Tipo de usuario" (`GET /user-types`, catálogo completo sin
filtrar) le saca la opción "Super Administrador" a quien no es Super Administrador, en los dos
formularios (alta y edición) — usando `useIsSuperAdmin()` (ya existía, lee el JWT decodificado
del lado del cliente). Es una comodidad de UI (evita el intento inútil), la regla real la
impone el backend.

## Qué quedó deliberadamente afuera (a pedido explícito del usuario)

`GET /users/:id` (el detalle que usa el diálogo de edición) sigue sin validar absolutamente nada
— ni pertenencia a empresa, ni tipo. Alguien podría, conociendo/adivinando un id, pedir el
detalle completo de un Super Administrador por API directo, aunque no lo vea en el listado.
Arreglar esto es un cambio más amplio (afecta a todos los usuarios, no solo a los Super
Administrador) y quedó fuera de este alcance a pedido del usuario.

Verificado con `tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en
vivo, a pedido del usuario (ver memoria del proyecto: no levantar backend/frontend para
verificar).
