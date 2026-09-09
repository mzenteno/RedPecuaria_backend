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
- `KardexEntry.movementType` (`'ingreso' | 'venta' | 'baja'`) y `investorUserId` (nullable):
  solo "venta" admite inversionista, obligatorio y validado contra la lista de inversionistas de
  la inversión (`assertKardexInvestor`, nueva `InvalidKardexInvestorException`) — "ingreso" y
  "baja" no admiten ninguno. Migración `AddKardexMovementTypeAndInvestor`. El diálogo de Kardex
  del frontend agrega el combo "Tipo de movimiento" y muestra/oculta campos según la elección.
  Ver `docs/investment/investment.md`.
- `AccessTokenPayload.username`/`fullName`: copiados del `User` al emitir el token (login,
  refresh, switch-company) — el menú de usuario del frontend (`TopBar`) ahora muestra el
  `username` (con el que se loguea) en vez del email. Ver `docs/auth-sessions/auth-sessions.md`.
- `GET /investments/mine` (`ListInvestmentsByInvestorUseCase` +
  `InvestmentRepository.findByInvestor`): "mis inversiones" del usuario logueado como
  inversionista, `userId` siempre de la sesión. `app/(main)/kardex` (frontend) ya no elige
  Propiedad primero — muestra directo una lista clickeable de esas inversiones. Ver
  `docs/investment/investment.md`.
- `GET /investments/by-gestion?gestion=` (`ListInvestmentsByGestionUseCase` +
  `InvestmentRepository.findActiveByCompanyAndGestion`): inversiones de cualquier propiedad de
  la empresa, para una gestión puntual. `app/(main)/investments` (frontend) invierte los roles
  de sus dos filtros: "Gestión" ahora dispara la consulta, "Propiedad" pasa a ser un filtro
  opcional del lado del cliente — ninguno de los dos ofrece una opción "Todos"/"Todas" (regla
  general del proyecto, ver §10 de `frontend/ARCHITECTURE.md`; dejarlo sin elegir ya significa
  "sin ese filtro"). `InvestmentTable` agrega la columna "Propiedad". `GET
  /investments?propertyId=` no cambia — lo sigue usando el atajo "Ver kardex". Ver
  `docs/investment/investment.md`.
- `GET /investments/by-investor?investorUserId=` (reusa `ListInvestmentsByInvestorUseCase`, ya
  existente para `mine`, con un `investorUserId` explícito en vez de la sesión): tercer filtro
  en `app/(main)/investments`, "Inversionista" — busca todas las inversiones de un inversionista
  puntual, de cualquier gestión y cualquier propiedad. Con "Gestión" elegida, "Inversionista"
  viaja como parámetro extra de esa misma consulta de servidor, no como filtro de cliente sobre
  la página ya traída. Ver `docs/investment/investment.md`.
- `InvestmentTable` agrega `style={{ minWidth: '64rem' }}` en el `<table>` (mismo patrón que
  `KardexTable`) — con 6 columnas, el `min-width: 40rem` genérico de `.data-table` ya no
  alcanzaba y el navegador comprimía/envolvía el texto de las celdas en vez de dejar scrollear
  horizontal.
- La fila de filtros de `app/(main)/investments` pasa de `flex flex-wrap` + `max-w-xs w-full`
  por combo a `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` — con 3 filtros, cada combo
  quedaba fijo en 320px sin importar cuánto sobrara al lado, un hueco vacío bien visible en
  anchos intermedios. Con la grilla, cada combo ocupa el 100% de su columna. Ver §14 de
  `frontend/ARCHITECTURE.md`.
- `.data-table` pasa a ser una grilla completa: `border` en la tabla y en cada `th`/`td`
  (`border-collapse: collapse` para que las líneas no salgan dobles), en vez de solo la línea
  inferior de antes — así el encabezado también se distingue de las filas a simple vista.
  Primer intento (fondo propio en `thead`, `--bg-page` y después `--bg-hover`) descartado, el
  usuario prefirió bordes. Afecta a toda tabla de la app de una sola vez (regla de
  `.data-table`). Ver §2 de `frontend/ARCHITECTURE.md`.
- Ícono de "Ver kardex" en `InvestmentTable`: `ClipboardList` (el mismo del ítem "Kardex" del
  sidebar), en vez de `BookOpen`.
- Al entrar a `/kardex` por el atajo "Ver kardex" de Inversiones, el sidebar sigue resaltando
  "Inversiones" (no "Kardex") y el botón "Volver" dice "Volver a Inversiones" — antes de este
  fix, ambos cambiaban a "Kardex"/"Mis inversiones" aunque conceptualmente seguías en
  Inversiones. "Volver a Inversiones" además reconstruye los filtros de Gestión/Propiedad que
  estaban activos (se llevan en la URL) — sin esto, volver dejaba los combos vacíos.
  `KardexPage`/`InvestmentsPage` le pasan `key={searchParams.toString()}` a su contenido — sin
  eso, cambiar el query string de la misma ruta (ej. entrar por el atajo y después hacer clic
  directo en el ítem del sidebar) no remonta el componente en Next, y la pantalla se queda
  mostrando el estado anterior. Ver §14 de `frontend/ARCHITECTURE.md`.
- `LocationMapPicker`/`PropertyDialog`: mapa de 260px → 520px de alto, zoom inicial 13 → 15, y
  el diálogo ensancha a `64rem` (antes usaba el `max-w-md` por defecto, 28rem) — la versión
  chica no daba suficiente precisión para marcar la ubicación. Ver `docs/property/property.md`.
- **Paginación de servidor para Propiedades, Inversiones (las 3 variantes) y Kardex** —
  cerrando la deuda documentada arriba: la excepción de paginación de cliente es **solo**
  Empresas/Roles/Permisos, todo lo demás debe paginar en el servidor sin importar el volumen
  esperado. `useProperties()`/`useMyInvestments()` habían copiado por error el criterio de esos
  3 ("un puñado, no hace falta"); mismo patrón que ya tenía `Users` en los cuatro casos:
  `PaginationParams`/`PaginatedResult<T>` (`domain/common`), `createQueryBuilder` +
  `.skip()/.take()/.getManyAndCount()` con `.andWhere()` condicional por filtro,
  `PaginatedResponseDto<T>` levantado a `{data, meta}` en la raíz por `ResponseInterceptor`,
  `httpClient.getPaginated<T>()` + `keepPreviousData` (React Query) del lado del cliente,
  buscador con debounce de 300ms.
  - `GET /properties` ahora recibe `page`/`pageSize`/`search` (`ListPropertiesByCompanyUseCase`,
    `PropertyRepository.findAllPaginated`); los combobox de Propiedad en Inversiones/Kardex usan
    un hook aparte sin paginar, `usePropertyOptions()` (hasta 100, para no romper un `<select>`
    con "página 2"), mismo criterio que `useInvestorUsers()`.
  - `GET /investments/mine`, `/investments/by-gestion` y `/investments/by-investor` ahora
    devuelven `PaginatedResponseDto` (antes la lista completa) — `ListInvestmentsByGestionUseCase`
    y `ListInvestmentsByInvestorUseCase` extienden `PaginationParams`,
    `InvestmentRepository.findByInvestor`/`findActiveByCompanyAndGestion` reciben
    `page`/`pageSize` además de sus filtros existentes.
  - `GET /kardex-entries?investmentId=` ahora pagina (`ListKardexEntriesByInvestmentUseCase`,
    `KardexEntryRepository.findActiveByInvestment`) y agrega búsqueda de servidor por `detail`
    (antes un `.filter()` en el cliente sobre la lista completa, ahora sin sentido con
    paginación real). `app/(main)/kardex` (frontend) mantiene dos tablas con paginación
    independiente en la misma pantalla — "Mis inversiones" y, una vez elegida una, sus
    movimientos — cada una con su propio estado de página.
  Ver §8/§9/§13/§14 de `frontend/ARCHITECTURE.md`.
- **"Mi perfil"** (`app/(main)/profile`, disparado desde el `TopBar` — antes "Mi perfil" no
  navegaba a ningún lado): dos tarjetas, "Datos personales" (edita `email`/`fullName` sobre el
  propio usuario, reusando `PATCH /users/:id`) y "Cambiar contraseña" (nuevo
  `PATCH /users/me/password` → `ChangeOwnPasswordUseCase`, exige la contraseña actual). Nueva
  `User.changePassword(newPasswordHash)` y `InvalidCurrentPasswordException` (401). Sin
  `RequirePermission` — mismo criterio que `/dashboard`, es una acción sobre uno mismo, no un
  módulo con permiso por rol. Ver `docs/user/user.md`.
- **Dashboard real, distinto por tipo de usuario** — reemplaza al dashboard con datos
  hardcodeados (`mockMeses`, `mockTopInversionistas`, `mockLotesEnAlerta`). Nuevo
  `AccessTokenPayload.isInvestor` (calculado una vez al emitir el token, mismo criterio que
  `isSuperAdmin`) decide qué ve el frontend: un Inversionista ve sus propias inversiones
  (`GET /dashboard/investor-summary`) y un Administrador/Super Administrador ve agregados de la
  empresa activa (`GET /dashboard/admin-summary`) — nuevo módulo `Dashboard` (backend),
  `DashboardRepository`/`DashboardRepositoryAdapter` (único repositorio del proyecto que cruza
  varios agregados: Property, Investment, KardexEntry, User), `GetInvestorDashboardUseCase`,
  `GetAdminDashboardUseCase`. Ningún KPI usa `KardexEntry.total` sin acotar a
  `movementType = 'venta'` — ese campo no tiene una fórmula definida todavía (ver
  `docs/investment/investment.md`), así que no hay ninguna tarjeta de "capital invertido" ni
  "ganancia". Ver `docs/dashboard/dashboard.md`.
- **"Propiedad" también dispara la consulta en Inversiones, y los 3 filtros se pueden
  limpiar** — antes, elegir solo "Propiedad" (sin "Gestión" ni "Inversionista") no mostraba
  nada, y ningún combo de la pantalla tenía forma de volver a "sin elegir" una vez elegido un
  valor. Nuevo `GET /investments/by-property?propertyId=&page=&pageSize=&gestion=&
  investorUserId=&search=` (`ListInvestmentsByPropertyPaginatedUseCase` +
  `InvestmentRepository.findActiveByPropertyPaginated`) — `activeMode` pasa a
  `'gestion' | 'investor' | 'property' | null`. Nueva prop `onClear` en `Select` (frontend):
  agrega un botón "×" que vuelve el combo a "sin elegir", sin reintroducir una opción
  "Todos"/"Todas" en la lista (la regla general del proyecto sigue vigente). Ver
  `docs/investment/investment.md`.
- **El saldo de una inversión (`balanceQuantity`/`balanceKilos`/`total`) pasa de
  `kardex_entries` a `investments`** — antes era una foto por fila del kardex, cargada a mano;
  ahora es el saldo VIGENTE de la inversión, mantenido transaccionalmente en cada alta/edición/
  baja de un `KardexEntry` (nuevo `Investment.applyBalanceDelta`, `computeMovementDelta` en
  `application/kardex`). Ingreso suma cantidad/kilos/total; Baja solo resta cantidad (no toca
  kilos); Venta resta cantidad/kilos y suma total. Nueva validación: la primera fila activa de
  una inversión siempre tiene que ser "ingreso" (`FirstKardexEntryMustBeIngresoException`) y
  ningún movimiento puede dejar el saldo en negativo
  (`InsufficientInvestmentBalanceException`). Migración `MoveKardexBalanceToInvestment`, sin
  migrar datos existentes. Verificado en vivo contra `RedPecuariaTest`: ingreso, baja, venta,
  rechazo por saldo insuficiente, reversión completa al desactivar y delta neto correcto al
  editar. Ver `docs/investment/investment.md`.
- **`KardexEntry.movementType` deja de ser un `varchar(20)` con el texto literal y pasa a
  `movementTypeId`, FK a la tabla nueva `kardex_movement_types`** — mismo patrón que
  `UserType`/`user_types` (catálogo cerrado sembrado por migración, sin CRUD propio, solo
  `GET /kardex-movement-types` para listar). Nuevo dominio `MovementType`
  (`isIngreso()`/`isVenta()`/`isBaja()`), `MovementTypeRepository` + adapter,
  `MovementTypeNotFoundException`. `assertKardexInvestor`/`computeMovementDelta` reciben el
  `MovementType` ya resuelto en vez de comparar strings. Migración
  `AddKardexMovementTypesTable`, con backfill real de los datos existentes (a diferencia del
  cambio de saldo anterior). Verificado en vivo contra `RedPecuariaTest`: backfill correcto de
  filas preexistentes, rechazo de un `movementTypeId` inexistente, y el ciclo completo de
  crear/editar/desactivar con el nuevo contrato. Ver `docs/investment/investment.md`.
- **`GET /kardex-entries` agrega el saldo corrido (cantidad/kilos) de cada fila**
  (`runningBalanceQuantity`/`runningBalanceKilos`) — el histórico "cuánto quedaba después de este
  movimiento puntual" que se ve en la planilla Excel de referencia, calculado al leer con una
  función de ventana SQL sobre todo el historial activo de la inversión, nunca guardado. Nuevo
  `KardexEntryListItemResponseDto` (solo para el listado; `POST`/`PATCH` no cambian). Se pagina en
  memoria, no con `LIMIT`/`OFFSET` de SQL — se encontró y corrigió en vivo un bug real de TypeORM
  (combinar `skip`/`take` con un `JOIN` corta la ventana antes de calcularla, dejando cada página
  con el acumulado de sus propias filas nomás). Verificado con `pageSize=1` en las 3 páginas de
  una inversión de prueba. Ver `docs/investment/investment.md`.
- **`Investment.isFinished`** — estado de negocio (Activa/Terminada), elegido a mano por el
  usuario desde el diálogo de edición (nuevo combo "Estado", solo visible al editar). Distinto de
  `isDeleted`: una inversión terminada sigue totalmente visible y operable. Migración
  `AddIsFinishedToInvestments`, siempre `false` al crear. `InvestmentTable` agrega la columna
  "Estado" con una etiqueta de color. Verificado en vivo contra `RedPecuariaTest`. Ver
  `docs/investment/investment.md`.

### Fixed
- **Migraciones en producción sin correr en Render** (causaba 500 en `GET
  /dashboard/admin-summary`, columnas `movement_type`/`investor_user_id` inexistentes en
  Neon) — el "Pre-Deploy Command" documentado como solución resultó ser solo para instancias
  pagas de Render, nunca llegó a correr. Solución final: `migrationsRun: true` +
  `migrations: [join(__dirname, 'migrations/*{.ts,.js}')]` en `TypeOrmModule.forRootAsync`
  (`app.module.ts`) — mismo criterio que Flyway en Spring Boot, corre en cada arranque del
  proceso usando la misma conexión que ya arma la app, contra los `.js` ya compilados (no
  necesita `ts-node` en producción). Verificado en los dos modos (compilado y `nest start`)
  contra `RedPecuariaTest`: revirtiendo una migración a mano y confirmando que el arranque la
  vuelve a aplicar sola. Se probó antes encadenar `migration:run` a `start:prod` (funcionaba,
  pero requería mover `ts-node`/`typescript` a `dependencies`) — descartado en favor de esta
  solución, más simple. Ver `ARCHITECTURE.md` §12.
- **"Nueva inversión" ya no depende de ningún filtro elegido** — el botón necesitaba, además
  del permiso, que la página ya tuviera una Propiedad elegida en su combo de filtro
  (`onNew={canCreate && propertyId ? ... : undefined}`), así que con los 3 filtros vacíos (o
  con Gestión/Inversionista elegidos pero sin Propiedad) el botón directamente no aparecía.
  `InvestmentDialog` ahora tiene su propio combobox de Propiedad — el botón se movió fuera de
  `PageToolbar`/`activeMode`, a su propia fila siempre visible con solo el permiso `canCreate`.
  Ver `docs/investment/investment.md`.
- **El combo de Propiedad del alta se precarga con el filtro de la página**, si ya había uno
  elegido — nuevo `defaultPropertyId` en `InvestmentDialog` (sigue siendo editable, no fijo).
  Evita elegir la misma propiedad dos veces. Ver `docs/investment/investment.md`.
- **La propiedad de una inversión se puede cambiar al editar** — se había deshabilitado el
  combo de Propiedad al editar por error, asumiendo el mismo criterio que `username`
  (identificador que no se puede tocar); el usuario corrigió que sí debía poder cambiarse.
  `Investment.propertyId` deja de ser `readonly` (`update()` ahora también lo recibe);
  `UpdateInvestmentUseCase` valida que la propiedad nueva sea de la empresa activa si cambió
  (mismo chequeo que al crear, `PropertyNotFoundException` si no). Verificado en vivo contra
  `RedPecuariaTest`: se movió una inversión de una propiedad a otra y de vuelta. Ver
  `docs/investment/investment.md`.
- El checklist de "Inversionistas" (`InvestmentDialog`) muestra solo el nombre completo — antes
  también mostraba el `username` entre paréntesis (ej. "mauricio (jmauricio)").
- **Diálogos con muchos campos pasan a pantalla completa en mobile** — nueva clase
  `.dialog-panel-lg`, aplicada a `UserDialog`/`PropertyDialog`/`InvestmentDialog`/
  `KardexEntryDialog` (los 4 con más campos del proyecto). Por debajo de 640px de ancho, en vez
  del modal chico centrado con margen oscuro a los costados, ocupa toda la pantalla — mismo
  criterio que cualquier app mobile (Material Design/iOS): modal chico solo para confirmaciones
  cortas. `CompanyDialog`/`RoleDialog` (un solo campo) no cambian. Verificado con Playwright en
  414×846 (mismo viewport que reportó el usuario) y en desktop, sin cambios ahí. Ver
  `frontend/ARCHITECTURE.md` §2.

### Security
- **Un inversionista ya no ve las ventas de otros inversionistas de la misma inversión** —
  `GET /kardex-entries?investmentId=` filtra los movimientos "venta" al propio usuario cuando
  quien pide el listado es de tipo Inversionista (`isInvestor` del token); "ingreso"/"baja"
  nunca se filtran (son generales). Un Administrador/Super Administrador sigue viendo todo.
  Filtrado en la query del backend, no solo ocultado en el frontend. Nuevo
  `FindKardexEntriesParams.restrictSalesToInvestorId`. Verificado en vivo contra
  `RedPecuariaTest` con dos inversionistas de prueba. Ver `docs/investment/investment.md`.
- **Ícono de "Notificaciones" del `TopBar` eliminado** — sin ningún evento de negocio que
  notificar todavía, se decidió quitarlo en vez de dejarlo decorativo indefinidamente (mismo
  criterio que "Configuración", quitado antes por el mismo motivo). El ícono de "Buscar" queda
  tal cual, decorativo a propósito — cada pantalla de listado ya tiene su propio buscador,
  un buscador global es una comodidad sin necesidad real sin cubrir hoy. Ver
  `frontend/ARCHITECTURE.md` §8.
