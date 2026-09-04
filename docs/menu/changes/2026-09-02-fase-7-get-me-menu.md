# 2026-09-02 — Fase 7: `GET /me/menu`

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `GetAuthorizedMenuUseCase` (`application/auth/use-cases/`): junta
`MenuRepository.findAllActive()` con `RoleMenuPermissionRepository.findByRole(roleId)` y
devuelve **el catálogo completo** de menús activos, cada uno con el permiso del rol (o `null`
si no tiene ninguno configurado) — a propósito no filtra ni arma el árbol final, esa
inferencia (mostrar un padre organizativo si al menos un hijo es visible) sigue siendo
responsabilidad del frontend, como ya estaba documentado.

Se agregó `GET /me/menu` en `MeController` — primer endpoint que usa `@CurrentUser('roleId')`
para pasar el rol del usuario autenticado al caso de uso, en vez de un parámetro del cliente
(el guard de la Fase 9 es lo que lo hace seguro). `MenuResponseDto`/`MenuMapper` nuevos.

Verificado contra la app real con el rol "Administrador": el menú "Administración" (padre
puramente organizativo) sale con `canView: false` (no tiene fila propia en
`role_menu_permissions`, como espera la regla de negocio), y sus 4 hijos salen con los 4
permisos en `true` (del seed). Sin token → 401.

## Motivo

Fase 7 del plan de `menu` — el frontend necesita esta información para armar el menú de
navegación real tras el login.

## Qué había antes

Solo existía `ListActiveMenusUseCase` (catálogo sin permisos), sin ningún endpoint HTTP —
esperando a que existiera el guard (Fase 9) para poder exponerlo con un `roleId` confiable.
