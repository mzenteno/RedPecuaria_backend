# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/). Este archivo
registra *qué* se implementó a nivel código; el *por qué* de cada decisión vive en
[`docs/`](docs/README.md) (ver [ARCHITECTURE.md §11](ARCHITECTURE.md)).

## [Unreleased]

### Added
- Reglas de arquitectura hexagonal del proyecto (`ARCHITECTURE.md`).
- Conexión a PostgreSQL vía TypeORM + scripts de migración del CLI (Fase 0 del plan de `auth`).
- Kernel compartido: `core/` (transacciones, hashing de contraseñas, hash determinístico) y
  `common/` (excepción base de dominio, filtro HTTP de excepciones).
- Migración inicial (`InitialSchema1787534864457`) con las 7 tablas del módulo `auth`:
  `companies`, `users`, `roles`, `user_companies`, `menus`, `role_menu_permissions`,
  `refresh_tokens` (Fase 1 del plan de `auth`).
- Documentación viva por funcionalidad en `docs/` (una carpeta por concepto, con estado
  actual + historial de cambios).
- Migración de seed (`SeedInitialData1787536340018`) con los datos iniciales del módulo
  `auth`: una empresa, un rol "Administrador" con permisos completos, el catálogo de menús
  ("Administración" y sus 4 hijos) y el primer usuario administrador (Fase 2 del plan).
- Tabla `user_types` y columna `users.user_type_id` (`AddUserType1787536781990`): clasificación
  informativa del usuario (Administrador/Inversionista), sin relación con los permisos del
  sistema (eso sigue siendo responsabilidad de `Role`/`RoleMenuPermission`).
- Dominio + persistencia (Fase 3) de los 7 conceptos del módulo `auth`: `Company`, `User`,
  `UserType`, `Role`, `UserCompany`, `Menu`, `RoleMenuPermission` — entidades, puertos de
  repositorio, adaptadores TypeORM y sus módulos de Nest, conectados en `app.module.ts`.
  Verificado con una consulta real contra los datos sembrados en Fase 2.
- Casos de uso CRUD de roles (Fase 6): `CreateRoleUseCase`, `UpdateRoleUseCase`,
  `DeactivateRoleUseCase`, `ListRolesByCompanyUseCase` en `application/auth/use-cases/`, con
  test unitario cada uno (13 tests, TDD, sin Nest ni base de datos). Nueva excepción de dominio
  `InvalidRoleNameException`, conectada a `Role.create()`/`rename()`. Primera vez que se usa la
  capa `application/` del proyecto — sin `RoleController` todavía (pendiente el guard de
  autorización de `auth-sessions`, Fase 8-9). Ver `docs/role/role.md`.
- Casos de uso del resto de módulos de `auth`, siguiendo el mismo patrón que `role` — sin
  controladores HTTP ni tests unitarios todavía (a pedido explícito):
  - `company` (Fase 4): `CreateCompanyUseCase`, `UpdateCompanyUseCase`,
    `DeactivateCompanyUseCase`, `ListCompaniesUseCase`. Se agregó `findAll` a
    `CompanyRepository` (puerto + adaptador), que no existía.
  - `user` (Fase 5): `RegisterUserUseCase` — primer caso de uso transaccional real del
    proyecto: crea `User` + `UserCompany` en una sola transacción (`TransactionManager`,
    §7), validando email/tipo/empresa/rol-de-esa-empresa y hasheando la contraseña
    (`PasswordHasher`) — además `DeactivateUserUseCase`, `ChangeUserTypeUseCase`.
  - `user-type`: `ListUserTypesUseCase` (solo lectura, sin CRUD por diseño).
  - `menu`: `ListActiveMenusUseCase` (solo lectura, sin CRUD por diseño).
  - `permission` (Fase 7): `SetRoleMenuPermissionUseCase` (upsert), `ListPermissionsByRoleUseCase`.
    Se agregó `MenuNotFoundException` (domain/auth/exceptions), que no existía.
  - `user-company`: `AssignUserToCompanyUseCase`, `ChangeUserCompanyRoleUseCase`,
    `DeactivateUserCompanyUseCase`, `ListUserCompaniesByUserUseCase`. Se agregó
    `UserCompanyNotFoundException` (domain/auth/exceptions), que no existía.
  - `auth.module.ts` y `user.module.ts` ahora se importan mutuamente (`forwardRef`) por una
    dependencia circular real: `RegisterUserUseCase` necesita `RoleRepository`/
    `UserCompanyRepository` de `auth`, y `AssignUserToCompanyUseCase`/
    `ListUserCompaniesByUserUseCase` necesitan `UserRepository` de `user`.
  - Verificado con `tsc --noEmit` y `npm run build`, sin errores. Ver `docs/company/`,
    `docs/user/`, `docs/user-type/`, `docs/menu/`, `docs/permission/`, `docs/user-company/`.
- `auth-sessions` (Fase 8): login, refresh y logout, primer controlador HTTP del proyecto.
  - Dominio: entidad `RefreshToken`, puerto `RefreshTokenRepository`, excepciones
    `InvalidCredentialsException`, `InvalidRefreshTokenException`,
    `CompanySelectionRequiredException`, y el puerto `TokenGenerator`
    (`domain/core/ports/token-generator.port.ts`).
  - Infraestructura: `JwtTokenGeneratorAdapter` (`@nestjs/jwt`), registrado en `core.module.ts`
    junto con `JwtModule.registerAsync` (lee `JWT_ACCESS_SECRET`/`JWT_ACCESS_EXPIRES_IN_SECONDS`).
    `RefreshTokenEntity` + `RefreshTokenRepositoryAdapter` en `infrastructure/auth/`.
  - Application: `LoginUseCase`, `RefreshTokenUseCase` (rota el refresh token en cada uso;
    revoca todas las sesiones del usuario si detecta reuso de un token ya revocado),
    `LogoutUseCase`.
  - `AuthSessionsController` (`POST /auth/login`, `/auth/refresh`, `/auth/logout`) — endpoints
    públicos, sin guard (son los que emiten el token). Se agregó el `ValidationPipe` global en
    `main.ts`, que no existía.
  - Se corrió `eslint --fix` sobre todo `src/` (solo formato, deuda acumulada de rondas
    anteriores).
  - Verificado con `tsc --noEmit` y `npm run build`, sin errores. Ver
    `docs/auth-sessions/auth-sessions.md`.
  - **Fix**: probado el flujo real (login/refresh/logout, con la base de datos y el usuario
    admin sembrados) se encontró que el access token expiraba de inmediato (`iat === exp`).
    Causa: `ConfigService.get()` devuelve siempre un string del `.env`, y el `expiresIn` de
    `jsonwebtoken` interpreta un string numérico como **milisegundos** (vía la librería `ms`),
    no segundos — `"900"` se resolvía a 0 segundos. Se corrigió forzando `Number(...)` en
    `core.module.ts`. Reverificado: el token ahora expira a los 900s como corresponde.
- Forma estándar de respuesta para toda la API (ver ARCHITECTURE.md §6): toda respuesta —
  éxito o error — comparte `{ success, statusCode, timestamp, path, ... }`.
  - `infrastructure/common/http/response.interceptor.ts` (nuevo): envuelve toda respuesta
    exitosa en `{ success: true, statusCode, timestamp, path, data }`, sin tocar ningún
    controlador existente. Excluye `204 No Content` (no debe llevar body).
  - `domain-exception.filter.ts` → renombrado a `global-exception.filter.ts`
    (`DomainExceptionFilter` → `GlobalExceptionFilter`): pasó de `@Catch(DomainException)` a
    `@Catch()` — ahora también da formato consistente a errores de `ValidationPipe`/`HttpException`
    de Nest y a errores técnicos no controlados (500 genérico, logueado en servidor, sin filtrar
    detalles al cliente), no solo a `DomainException`.
  - Ambos registrados en `core.module.ts` (`APP_INTERCEPTOR`/`APP_FILTER`), mismo patrón que ya
    existía.
  - Reverificado con `tsc --noEmit`, `npm run build`, y contra la app real (login, refresh,
    logout, error de dominio, error de `ValidationPipe`): las tres formas de error salen
    idénticas, el 204 sigue sin body.
- `username` reemplaza a `email` como identificador de login; el email ya puede repetirse.
  - Migración `AddUsernameToUsers1788316775263`: agrega `users.user_name` (`NOT NULL`,
    `UNIQUE`), backfillea el usuario admin sembrado con `username = "admin"`, elimina
    `UQ_users_email`.
  - Dominio: `User` gana `username` (valida no-vacío, nueva `InvalidUsernameException`).
    Nueva `UsernameAlreadyRegisteredException`; se **elimina**
    `EmailAlreadyRegisteredException` (ya no aplica). `UserRepository.findByEmail` →
    `findByUsername`.
  - `LoginUseCase`/`LoginRequestDto`: reciben `username` en vez de `email`.
    `RegisterUserUseCase`: agrega `username` al input, valida duplicado de `username`.
  - Verificado con `tsc --noEmit`, `npm run build`, la migración corrida contra la base real, y
    login end-to-end (`username: "admin"` funciona; el email viejo como username falla, como
    corresponde). Ver `docs/user/user.md`, `docs/auth-sessions/auth-sessions.md`.
- Fase 9: guard global de autenticación (ver ARCHITECTURE.md §5.1).
  - `JwtAuthGuard` (`infrastructure/core/security/jwt-auth.guard.ts`), registrado vía
    `APP_GUARD` en `core.module.ts` — protege por defecto toda ruta nueva.
  - `@Public()` (`infrastructure/common/http/public.decorator.ts`), aplicado a
    `login`/`refresh`/`logout` de `AuthSessionsController` (únicas rutas que no lo necesitan).
  - `@CurrentUser()` (`infrastructure/common/http/current-user.decorator.ts`), lee
    `request.user` sin tocar `Request` de Express directo.
  - `MeController` (`GET /me`, nuevo) — primer endpoint protegido del proyecto, devuelve el
    payload del token actual; verifica el guard de punta a punta.
  - Verificado con `tsc --noEmit`, `npm run build`, y contra la app real: sin token → 401, token
    inventado → 401, token real → 200 con el payload; las rutas públicas siguen funcionando.
    Ver `docs/auth-sessions/auth-sessions.md`.
- Fase 7 de `menu`: `GET /me/menu` — primer endpoint que usa el `roleId` del usuario
  autenticado (`@CurrentUser`) en vez de un parámetro del cliente.
  - `GetAuthorizedMenuUseCase`: catálogo completo de menús activos + los permisos del rol
    sobre cada uno (`null`/`false` si no hay fila) — sin filtrar ni armar el árbol; esa
    inferencia (mostrar un padre organizativo si al menos un hijo es visible) sigue siendo
    responsabilidad del frontend, tal como ya estaba documentado en `docs/menu/menu.md`.
  - `MenuResponseDto`/`MenuMapper` (nuevos) en `infrastructure/auth/http/`.
  - Verificado contra la app real con el rol "Administrador": el menú padre puramente
    organizativo sale con los 4 permisos en `false` (sin fila propia, como espera la regla de
    negocio) y sus 4 hijos con los 4 permisos en `true` (del seed). Ver `docs/menu/menu.md`.
- CORS global + controladores CRUD de `company`, `role`, `user`, `user-type`, `permission`,
  `user-company` — todos los casos de uso que llevaban desde Fases 4-7 sin ningún endpoint HTTP.
  - `app.enableCors({ origin: config.get('CORS_ORIGIN', '*') })` en `main.ts`; nueva variable
    `CORS_ORIGIN` en `.env`/`.env.example` (default `*`, restringir antes de producción).
  - `CompanyController`, `RoleController`, `UserController`, `UserTypeController`,
    `PermissionController`, `UserCompanyController` (nuevos), cada uno con sus DTOs y mapper —
    ver la tabla "HTTP" en el `docs/<módulo>.md` correspondiente para las rutas exactas.
  - Todos protegidos por defecto por `JwtAuthGuard` (Fase 9) — sin `@RequiresPermission`
    todavía (ese diseño quedó documentado como pendiente en `docs/permission/permission.md`,
    no implementado a pedido explícito).
  - `UserResponseDto` nunca incluye `passwordHash`.
  - Verificado contra la app real, flujo completo: login → crear empresa → crear rol → asignar
    permiso → asignar usuario existente a la empresa nueva → login detecta 2 empresas activas y
    exige elegir (`CompanySelectionRequiredException`, confirma la Fase 8) → registrar usuario
    nuevo → login inmediato con ese usuario. Preflight CORS (`OPTIONS`) responde con los
    headers correctos. `tsc --noEmit` y `npm run build` sin errores.
- `GET /users` paginado — primer `GET` de lista del proyecto que pagina, establece el patrón
  general (ver ARCHITECTURE.md §6.1).
  - `PaginatedResult<T>`/`PaginationParams` (dominio, compartido, no específico de `User`) +
    `UserRepository.findAllPaginated` (TypeORM `findAndCount`) + `ListUsersUseCase`.
  - `ListUsersQueryDto` (`page`/`pageSize` con `@Type(() => Number)`, `pageSize` tope 100) +
    `PaginatedResponseDto<T>`. Se amplió `ResponseInterceptor` para reconocer `{data, meta}` y
    subir `meta` al nivel raíz del envoltorio en vez de anidarlo bajo `data`.
  - Autorización por permiso (`@RequiresPermission`) sigue **sin implementar a propósito** —
    se posterga para después de esta entrega (ver `docs/permission/permission.md`).
  - Verificado contra la app real: paginación sin superposición entre páginas, `page=0`
    rechaza con 400. Ver `docs/user/user.md`.
- `DomainException` ahora acepta un `details?: Record<string, unknown>` opcional, y
  `GlobalExceptionFilter` lo reenvía en la respuesta HTTP cuando está presente (campo
  `details`, solo si existe). Cierra el gap documentado en `docs/auth-sessions/auth-sessions.md`
  donde `CompanySelectionRequiredException.choices` se calculaba pero se perdía en el filtro:
  ahora `CompanySelectionRequiredException` pasa `{ choices }` como `details` y el frontend
  puede armar el selector de empresa. Genérico a propósito — cualquier excepción de dominio
  futura puede sumar datos estructurados sin tocar el filtro de nuevo. Verificado con
  `tsc --noEmit`, `eslint` y `curl` contra un usuario con 2 empresas activas.
- Tipo de usuario "Super Administrador" (migración `AddSuperAdminUserType`, catálogo pasa de
  2 a 3 tipos). `UserType` deja de ser puramente informativo: ahora define la visibilidad de
  empresas — Super Administrador ve todas (`GET /companies`), Administrador e Inversionista
  ven solo la de su sesión actual. `AccessTokenPayload` suma `isSuperAdmin: boolean`, calculado
  una vez en `LoginUseCase`/`RefreshTokenUseCase`. El usuario admin sembrado se reclasifica a
  Super Administrador. Ver `docs/user-type/user-type.md`.
- `CompanyRepository.findAllActive()` (reemplaza `findAll()`): filtra `isActive: true` en la
  query en vez de en el caso de uso. Migración `AddCompaniesMenuPath` asigna `path: '/companies'`
  al menú "Empresas". Ver `docs/company/company.md`.
- Menú "Dashboard" (migración `AddDashboardMenu`, raíz, `order: 0`) — antes no había forma de
  volver al dashboard desde el sidebar una vez que se navegaba a otra pantalla. `can_view`
  concedido a los roles existentes; los roles nuevos necesitan que se les conceda a mano por
  ahora. Ver `docs/menu/menu.md`.
- `.env.test.example` — plantilla para levantar un backend efímero contra `RedPecuariaTest`
  (base separada, ya migrada) al verificar un CRUD de punta a punta manualmente, sin escribir
  datos de prueba en la base real de desarrollo. Ver [ARCHITECTURE.md §8](ARCHITECTURE.md).

### Changed
- El campo de baja lógica pasó de `is_active` a `is_deleted` (polaridad invertida: `false` =
  normal, `true` = dado de baja) en las 7 tablas que lo tienen (`companies`, `users`, `roles`,
  `user_companies`, `menus`, `role_menu_permissions`, `user_types`) — nombre más claro para lo
  que el campo representa. El verbo de negocio sigue siendo "desactivar"
  (`deactivate()`/`PATCH .../deactivate`), solo cambió el campo persistido. Ver
  `docs/company/changes/2026-09-03-is-active-a-is-deleted.md`.
- Los ids de las 7 tablas del módulo `auth` pasaron de `uuid` (generados en el dominio) a
  `bigint GENERATED ALWAYS AS IDENTITY` (generados por Postgres al insertar).
- Reorganización de `src/modules/`: de 7 carpetas (una por entidad) a 3 módulos por bounded
  context real: `company/` (Company), `user/` (User + UserType), `auth/` (Role +
  RoleMenuPermission + UserCompany + Menu — y a futuro JWT/sesiones). Sin cambios de dominio
  ni de esquema, solo reubicación de archivos y ajuste de imports; verificado que compila,
  arranca, y las consultas contra los datos sembrados siguen funcionando igual.
- Migración de la estructura de carpetas de "módulo primero" (`modules/<modulo>/domain`,
  `modules/<modulo>/infrastructure`) a **layer-first** (`domain/<modulo>`,
  `infrastructure/<modulo>`, y una `application/` a nivel raíz para cuando existan casos de
  uso). `core/` y `common/` se reubicaron con el mismo criterio (`domain/core`,
  `infrastructure/core`, `domain/common`, `infrastructure/common`). Los path aliases de
  `tsconfig.json` pasaron de `@core/*`/`@common/*`/`@modules/*` a `@domain/*`/`@application/*`/
  `@infrastructure/*`. Sin cambios de dominio ni de esquema, solo reubicación de archivos y
  ajuste de imports (los que cruzaban capa dentro de un mismo módulo ahora usan los alias en
  vez de rutas relativas); verificado con `tsc --noEmit` sin errores. Ver
  [ARCHITECTURE.md §3](ARCHITECTURE.md).
- Convención de nombres de entidad/repositorio (afecta `auth`, `company`, `user`): en
  `infrastructure/<modulo>/`, la carpeta `persistence/` se separó en `entities/` y
  `repositories/`. La entidad de dominio perdió el sufijo `.entity.ts` (ahora `user.ts`, `class
  User`); la entidad ORM pasó de `.orm-entity.ts`/`*OrmEntity` a `.entity.ts`/`*Entity`
  (`user.entity.ts`, `class UserEntity`); la implementación de repositorio pasó del prefijo
  `typeorm-*.repository.ts`/`TypeOrm*Repository` a `.repository.adapter.ts`/`*RepositoryAdapter`
  (`user.repository.adapter.ts`, `class UserRepositoryAdapter`), nombrada por su rol
  arquitectónico y no por la tecnología. Sin cambios de dominio ni de esquema; verificado con
  `tsc --noEmit` y `npm run build` sin errores. Ver [ARCHITECTURE.md §3-4](ARCHITECTURE.md).
- La misma convención (`.adapter.ts`/`*Adapter`, sin prefijo de tecnología) se extendió a los
  singletons de `infrastructure/core/`: `typeorm-transaction-manager.ts`/`TypeOrmTransactionManager`
  → `transaction-manager.adapter.ts`/`TransactionManagerAdapter`;
  `bcrypt-password-hasher.ts`/`BcryptPasswordHasher` → `password-hasher.adapter.ts`/
  `PasswordHasherAdapter`; `sha256-hash.service.ts`/`Sha256HashService` →
  `hash-service.adapter.ts`/`HashServiceAdapter`. Sin cambios de comportamiento; verificado con
  `tsc --noEmit` y `npm run build` sin errores.
- Simplificación de las entidades de dominio (`Role`, `Menu`, `RoleMenuPermission`,
  `UserCompany`, `Company`, `User`, `UserType`): los campos sin mutador propio (relaciones por
  id sin método que las cambie, y `createdAt`) pasaron de `private _campo` + `get campo()` a
  `public readonly campo` directo, declarado como parameter property del constructor — sin
  librería tipo Lombok, aprovechando azúcar sintáctico nativo de TypeScript. Los campos
  mutables (con un método de negocio que los cambia, ej. `rename()`, `deactivate()`,
  `changeRole()`) y `id` (con lógica: lanza si no está persistido) se mantienen `private` +
  `get`. Sin cambio de comportamiento externo (el acceso `objeto.propiedad` es idéntico desde
  afuera); verificado con `tsc --noEmit` y `npm run build` sin errores.
- Config de Jest (`package.json`): se agregó `moduleNameMapper` para los alias `@domain/*`,
  `@application/*`, `@infrastructure/*` — no existía ningún `.spec.ts` en el proyecto hasta la
  Fase 6 de `role`, así que nunca hizo falta antes.

### Security
- `UpdateRoleUseCase`, `DeactivateRoleUseCase`, `SetRoleMenuPermissionUseCase` y
  `ListPermissionsByRoleUseCase` ahora validan que el rol pertenezca a la empresa activa de
  quien hace la petición — antes ninguno lo validaba, cualquiera con sesión podía editar,
  desactivar o leer/pisar los permisos de un rol de otra empresa adivinando su id. Ver
  `docs/permission/permission.md`.
- `ChangeUserCompanyRoleUseCase` y `ChangeUserTypeUseCase` — mismo criterio: ahora validan
  empresa activa antes de reasignar el rol de un vínculo o el `UserType` de un usuario. Este
  último era el más serio: dejaba promover a **cualquier** usuario del sistema a "Super
  Administrador" sin ninguna relación con la empresa de quien hacía el cambio. Ver
  `docs/user-company/user-company.md`.

### Added (negocio ganadero)
- `Property` (finca ganadera): tabla `properties`, dominio + persistencia + CRUD completo
  (`PropertyController`), pantalla `app/(main)/properties` con selector de ubicación por mapa
  (Leaflet + OpenStreetMap, sin API key). Primer módulo del negocio ganadero en sí — ver
  `docs/property/property.md`.
- `Investment` (compra de ganado + inversionistas) y `KardexEntry` (ficha de movimientos):
  tablas `investments`, `investment_investors`, `kardex_entries`, CRUD completo
  (`InvestmentController`, `KardexEntryController`), pantallas `app/(main)/investments` y
  `app/(main)/investments/[id]/kardex`. Fase 1 deliberadamente sin ningún cálculo automático
  (saldos, reparto entre inversionistas, el modelo de negocio 45/55) — ver
  `docs/investment/investment.md` para el detalle completo de las decisiones de alcance.
- `UserType.isInvestor()` / `INVESTOR_USER_TYPE_NAME` — solo un usuario de tipo Inversionista
  puede aparecer en la lista de inversionistas de una `Investment`.
- Menús "Propiedades"/"Inversiones" agregados al catálogo, con permisos completos para los
  roles existentes (migración `AddPropertyInvestmentKardex`).
- Menú padre "Inversiones" (`investment-management`): agrupa "Propiedades" e "Inversiones" en
  el sidebar (antes colgaban de "Administración"). Menú `kardex` propio, con sus 4 flags de
  permiso independientes de `investments` (permite dar "puede crear inversiones pero no tocar
  el kardex" a un rol, o viceversa) — columna nueva `menus.show_in_sidebar` (migración
  `AddInvestmentGroupAndKardexMenu`, luego `MakeKardexOwnSidebarEntry`). Kardex terminó como
  **pantalla propia** del sidebar (`/kardex`, hermana de Propiedades/Inversiones), no como menú
  invisible: un rol que solo hace kardex necesita una forma de llegar sin pasar por el CRUD de
  Inversiones. `app/(main)/kardex` (frontend) reemplaza a `app/(main)/investments/[id]/kardex` —
  combobox de Propiedad + Inversión en vez de ruta dinámica por id. Ver `docs/menu/menu.md`.
