# Arquitectura del proyecto — Backend RedPecuaria

Este documento define las reglas de arquitectura para el backend. El proyecto usa
**NestJS + TypeScript** y sigue **arquitectura hexagonal (Ports & Adapters)**.
Toda persona (o agente) que agregue código debe respetar estas reglas.

## 0. Flujo de trabajo: nunca implementar sin aprobación

> Regla absoluta: **no se escribe ni edita código sin aprobación previa del usuario.** Esto
> aplica a todo — módulos nuevos, features, fixes, refactors, cambios de configuración —
> sin excepción por tamaño o "obviedad" del cambio.

- Antes de tocar código, siempre se presenta una **lista de pasos** de lo que se va a hacer
  (el plan/fix), y se espera aprobación explícita del usuario antes de crear/editar un solo
  archivo.
- La lista de pasos debe ser concreta y accionable, no una descripción vaga. Como mínimo:
  - Qué archivos se van a crear o modificar, y qué hace cada paso.
  - Entidades, value objects y puertos (repositorios/servicios) del dominio involucrados
    (cuando aplique).
  - Casos de uso a implementar y qué orquestan (cuando aplique).
  - Endpoints/adaptadores de infraestructura (controladores, DTOs, guards) a agregar
    (cuando aplique).
  - Qué escrituras deben ser transaccionales en conjunto (ver §7).
  - Decisiones que requieren input (librerías nuevas, modelos de datos, trade-offs) — estas se
    preguntan **antes** de armar la lista de pasos, no se asumen.
- Solo después de la aprobación explícita se procede a crear/editar archivos. Si durante la
  implementación surge un cambio de alcance no cubierto por lo aprobado, se pausa y se
  confirma antes de seguir.
- Un fix, por pequeño que parezca (una línea, un typo, un ajuste de config), también pasa
  primero por la lista de pasos y la aprobación. No hay atajos por "es trivial".
- **Cada archivo que se crea se explica**: al presentar el plan (y de nuevo al crear el
  archivo), se dice en 1-2 líneas qué es y para qué sirve ese archivo concretamente — no basta
  con el nombre o la ruta. El objetivo es que quien lee el plan entienda el rol de cada pieza
  sin tener que abrir el archivo ni conocer de antemano el patrón usado.

## 1. Principio general

> El dominio (las reglas de negocio) **no depende de nada**. Todo lo demás depende del dominio.

- El **dominio** no importa NestJS, TypeORM/Prisma, Express, ni ninguna librería externa.
- Los **casos de uso** (aplicación) orquestan el dominio a través de **puertos** (interfaces).
- Los **adaptadores** (infraestructura) implementan esos puertos: HTTP, base de datos,
  mensajería, servicios externos, etc.
- La dependencia siempre apunta **hacia adentro**: `infraestructura → aplicación → dominio`.
  Nunca al revés.

## 2. Capas

### 2.1 Domain (`domain`)

Núcleo del negocio. Sin decoradores de NestJS, sin ORM, sin `import` de librerías externas
(salvo utilidades puras tipo `uuid` si es estrictamente necesario).

Contiene:
- **Entidades** (`entities/*.ts`, sin sufijo — ver §4): objetos con identidad y comportamiento
  propio.
- **Value Objects** (`*.vo.ts`): objetos inmutables sin identidad (ej. `Email`, `Money`).
- **Puertos de salida / repositorios** (`*.repository.ts` como interfaz): contratos que la
  infraestructura debe implementar.
- **Excepciones de dominio** (`*.exception.ts`): errores de negocio, no HTTP.
- **Domain services** (opcional): lógica que no pertenece a una sola entidad.

Reglas:
- Las entidades validan sus propias invariantes en el constructor o en métodos de fábrica.
- Nada en `domain` puede lanzar `HttpException` ni conocer códigos de estado HTTP.
- Nada en `domain` puede importar desde `application` o `infrastructure`.
- **Encapsulación de campos ("Tell, Don't Ask")**: una entidad nunca expone un setter público
  genérico (`set nombre(valor)`) — el único punto de entrada para cambiar un campo mutable es
  un método con nombre de intención de negocio (`rename()`, `deactivate()`, `changeRole()`,
  etc.), nunca asignación directa. Así la validación de una invariante se escribe una sola vez
  y es imposible saltársela desde afuera.
  - Campo **sin ningún método que lo cambie** (relaciones por id como `companyId`/`parentId`,
    o el timestamp `createdAt`) → se declara `public readonly` directo como parameter
    property del constructor (`constructor(public readonly companyId: string, ...)`), sin
    `private _campo` + `get campo()` — no hay nada que proteger porque no hay forma de
    mutarlo, así que el getter sería boilerplate puro. TypeScript no tiene un equivalente a
    Lombok, pero esto cubre el mismo caso sin librería.
  - Campo **con un método que lo cambia**, o cuyo getter tiene lógica (ej. `id`, que lanza si
    la entidad no está persistida) → se queda `private _campo` + `get campo()`. No se
    generan getters/setters simétricos para todo por uniformidad: cada `get` que existe es
    porque protege algo concreto.

### 2.2 Application (`application`)

Orquesta el dominio para cumplir un caso de uso concreto.

Contiene:
- **Casos de uso / use cases** (`*.use-case.ts`): una clase = una acción del negocio
  (ej. `CreateAnimalUseCase`, `RegisterVaccinationUseCase`).
- **Puertos de entrada** (opcional, `*.port.ts`): interfaces que exponen los casos de uso.
- **Puertos de salida** (`*.port.ts` o interfaces en `domain` si son de repositorio): contratos
  para servicios externos (email, storage, pagos, etc.) que la infraestructura implementa.
- **DTOs de aplicación**: estructuras de entrada/salida de los casos de uso (no confundir con
  los DTOs HTTP de los controladores).

Reglas:
- Los casos de uso dependen de **interfaces** (puertos), nunca de implementaciones concretas.
- La inyección de dependencias se resuelve en `infrastructure` (módulos de NestJS), usando
  tokens (`Symbol` o `InjectionToken`) para los puertos.
- Un caso de uso no conoce Express/Fastify, ni `Request`/`Response`, ni el ORM.

### 2.3 Infrastructure (`infrastructure`)

Todo lo que conecta el mundo exterior con la aplicación. Aquí sí vive NestJS.

Contiene, por tipo de adaptador:
- **Adaptadores de entrada (driving/primary)**: `controllers` (HTTP/REST), `resolvers`
  (GraphQL), `consumers` (colas/eventos), `cli` (comandos).
- **Adaptadores de salida (driven/secondary)**: `persistence` (repositorios concretos con
  TypeORM/Prisma/Mongoose), `http-clients` (llamadas a APIs externas), `mailers`, `storage`.
- **Módulos de NestJS** (`*.module.ts`): conectan todo mediante inyección de dependencias,
  registrando los `providers` que satisfacen los puertos definidos en `application`/`domain`.
- **DTOs HTTP y validación** (`*.dto.ts` con `class-validator`): la forma de entrada/salida
  de la API, distinta de las entidades de dominio. Se mapean con un `*.mapper.ts`.

Reglas:
- Los controladores son delgados: reciben el request, arman el input del caso de uso, lo
  invocan y traducen la salida/errores a la respuesta HTTP.
- Los errores de dominio se traducen a HTTP en un `exception filter`, no en cada controlador.
- El mapeo entidad ⇄ modelo de persistencia vive en `infrastructure/persistence/*.mapper.ts`.

## 3. Estructura de carpetas

Organización **por capa hexagonal primero** (`domain/`, `application/`, `infrastructure/` como
raíces de `src/`), y dentro de cada capa, una subcarpeta por módulo de negocio
(feature/bounded context). `core` y `common` (código transversal, no de un módulo específico)
son subcarpetas más dentro de cada capa, al mismo nivel que los módulos de negocio:

```
src/
  domain/
    core/ports/                    # puertos de infra transversal (transacciones, hashing)
    common/                        # building blocks sin estado propio: excepción base, etc.
    animal/
      entities/
        animal.ts                   # sin sufijo .entity — el dominio no lleva marcas
                                     # técnicas, la carpeta ya dice qué es
      value-objects/
        animal-id.vo.ts
      repositories/
        animal.repository.ts        # interfaz (puerto de salida), sin prefijo I
      exceptions/
        animal-not-found.exception.ts

  application/
    animal/
      use-cases/
        create-animal.use-case.ts
        get-animal.use-case.ts
      ports/
        notifier.port.ts            # puerto de salida (ej. notificaciones)
      dto/
        create-animal.input.ts

  infrastructure/
    core/                          # singletons @Global(), importados una sola vez en AppModule
      config/
      persistence/
        transaction-manager.adapter.ts  # class TransactionManagerAdapter — implementa
                                         # domain/core/ports/transaction-manager.port.ts
      security/
        password-hasher.adapter.ts      # class PasswordHasherAdapter
        hash-service.adapter.ts         # class HashServiceAdapter
      core.module.ts
    common/
      http/                        # filtros, etc. — se importan donde se necesiten,
                                    # no son providers globales
    animal/
      http/
        animal.controller.ts
        dto/
          create-animal.request.dto.ts
          animal.response.dto.ts
        animal.mapper.ts
      entities/
        animal.entity.ts            # class AnimalEntity — modelo TypeORM (@Entity()),
                                     # distinto de domain/animal/entities/animal.ts (class Animal)
      repositories/
        animal.repository.adapter.ts  # class AnimalRepositoryAdapter — implementa
                                       # animal.repository.ts. Se nombra por el rol
                                       # arquitectónico (adapter), no por la tecnología
                                       # (evita un nombre como "typeorm-*" que quedaría
                                       # obsoleto si el día de mañana cambia el ORM)
      animal.module.ts

  main.ts
  app.module.ts
```

- Cada módulo de negocio (`animal`, `auth`, `company`, `user`, ...) es una subcarpeta con el
  mismo nombre repetida en `domain/`, `application/` (cuando tenga casos de uso) e
  `infrastructure/` — nunca una carpeta única que mezcle las tres capas.
- **Excepción documentada: `dashboard`** — un módulo de solo lectura que resume datos de varios
  otros (`property`, `investment`, `kardex`, `user`). Su repositorio de infraestructura
  (`DashboardRepositoryAdapter`) inyecta entidades TypeORM de esos otros módulos directo (vía
  `TypeOrmModule.forFeature` registrado de nuevo en `dashboard.module.ts`), en vez de pasar por
  los repositorios de dominio de cada uno — esos exponen operaciones pensadas para su propio
  CRUD, no los `JOIN`s/agregaciones de un reporte. Es el único módulo del proyecto con este
  criterio; no es el patrón a seguir para un módulo de negocio nuevo, solo para un futuro
  segundo modelo de lectura transversal genuino. Ver `docs/dashboard/dashboard.md`.
- `core/` y `common/` solo alojan código genérico reutilizable (ej. `TransactionManager`,
  excepción base de dominio, filtro HTTP), replicando el mismo patrón: una subcarpeta más
  dentro de cada capa, no una raíz aparte. No deben acumular lógica de negocio de un módulo
  específico. Ver ARCHITECTURE.md §11 solo aplica a `docs/`, no a esto.
- Imports entre capas de un mismo módulo (ej. un repositorio de `infrastructure/user` que
  necesita una entidad de `domain/user`) se hacen con los path aliases (`@domain/*`,
  `@application/*`, `@infrastructure/*`), nunca con rutas relativas `../../` que atraviesen
  capas — ya no son carpetas hermanas dentro de un mismo módulo, sino subcarpetas de raíces
  distintas de `src/`. Los imports relativos se reservan para archivos dentro de la misma
  subcarpeta de módulo y capa (ej. entre `infrastructure/user/repositories/` y
  `infrastructure/user/entities/`).
- **Entidad vs. entidad ORM**: la capa (`domain/` vs `infrastructure/`) es lo que distingue el
  objeto de dominio de su modelo de persistencia — no el nombre de archivo. El de dominio no
  lleva sufijo (`user.ts`, `class User`); el de infraestructura sí (`user.entity.ts`,
  `class UserEntity`) porque ahí es donde realmente hace falta marcar que es un modelo TypeORM.
- **Interfaz vs. implementación de repositorio**: mismo criterio. La interfaz de dominio no
  lleva prefijo `I` ni sufijo (`user.repository.ts`, `interface UserRepository`); la
  implementación de infraestructura se marca con `.adapter.ts` y el sufijo `Adapter` en la
  clase (`user.repository.adapter.ts`, `class UserRepositoryAdapter`) — nombrada por su rol
  arquitectónico (adaptador de un puerto), no por la tecnología concreta.
- **Historial:** hasta 2026-08-24 el proyecto organizaba primero por módulo y, dentro de cada
  módulo, por capa (`modules/<modulo>/domain`, `modules/<modulo>/infrastructure`), con
  `persistence/` agrupando entidad ORM + repositorio, y la implementación marcada con el
  prefijo `typeorm-*`. Se migró a layer-first (ver `CHANGELOG.md`) para que la regla de
  dependencias (§9) se pueda verificar con un solo glob por carpeta raíz de capa, y se separó
  `persistence/` en `entities/`/`repositories/` con la convención de nombres de arriba.

## 4. Convenciones de nombres

| Elemento                          | Sufijo/patrón                  | Ejemplo                            |
|------------------------------------|----------------------------------|--------------------------------------|
| Entidad de dominio (`domain/`)     | *(sin sufijo)* `.ts`             | `animal.ts` → `class Animal`         |
| Entidad ORM (`infrastructure/`)    | `.entity.ts`                    | `animal.entity.ts` → `class AnimalEntity` |
| Value Object                       | `.vo.ts`                        | `animal-id.vo.ts`                    |
| Puerto/interfaz de repositorio (`domain/`) | `.repository.ts` / `.port.ts` | `animal.repository.ts` → `interface AnimalRepository` |
| Implementación de repositorio (`infrastructure/`) | `.repository.adapter.ts` | `animal.repository.adapter.ts` → `class AnimalRepositoryAdapter` |
| Implementación de cualquier otro puerto (`infrastructure/`) | `.adapter.ts` | `password-hasher.adapter.ts` → `class PasswordHasherAdapter` (implementa `PasswordHasher` de `domain/core/ports/password-hasher.port.ts`) |
| Caso de uso                        | `.use-case.ts`                  | `create-animal.use-case.ts`          |
| Excepción de dominio                | `.exception.ts`                 | `animal-not-found.exception.ts`      |
| Controlador                         | `.controller.ts`                | `animal.controller.ts`               |
| DTO HTTP                            | `.dto.ts`                        | `create-animal.request.dto.ts`       |
| Mapper                              | `.mapper.ts`                     | `animal.mapper.ts`                   |
| Módulo NestJS                       | `.module.ts`                     | `animal.module.ts`                   |

- Interfaces de puertos **no** llevan prefijo `I` (ej. `AnimalRepository`, no `IAnimalRepository`).
- La implementación de un puerto tampoco lleva prefijo de tecnología (nada de `typeorm-*`): se
  nombra por su rol arquitectónico con el sufijo `Adapter`/`.adapter.ts`, para que el nombre no
  quede obsoleto si cambia la tecnología concreta (TypeORM, Prisma, etc.).
- Tokens de inyección para puertos: constante `Symbol` exportada junto a la interfaz, ej.
  `export const ANIMAL_REPOSITORY = Symbol('AnimalRepository');`.

## 5. Inyección de dependencias (Nest)

- Los casos de uso reciben los puertos por constructor, usando `@Inject(TOKEN)`.
- El binding puerto → adaptador concreto se hace **solo** en el `*.module.ts` de infraestructura:

```ts
{
  provide: ANIMAL_REPOSITORY,
  useClass: TypeOrmAnimalRepository,
}
```

- Nunca se instancia una implementación concreta a mano dentro de un caso de uso.

### 5.1 Autenticación (guard global)

- `JwtAuthGuard` (`infrastructure/core/security/jwt-auth.guard.ts`) está registrado global vía
  `APP_GUARD` en `core.module.ts` — **protege por defecto** cualquier ruta nueva. No hay que
  acordarse de agregarle nada a un controlador para que quede protegido; es al revés.
- `@Public()` (`infrastructure/common/http/public.decorator.ts`) es la **única** forma de
  eximir una ruta del guard — se usa solo donde de verdad no aplica (ej. `login`, que es
  justamente el que emite el token).
- `@CurrentUser()` (`infrastructure/common/http/current-user.decorator.ts`) es la única forma
  en que un controlador debe leer el usuario autenticado — nunca `@Req() request: Request`
  a mano para sacar `request.user`.
- El guard valida identidad (¿quién sos?), no permisos (¿podés hacer esto?) — eso es
  autorización dinámica por menú, ver `docs/permission/permission.md` y
  `docs/auth-sessions/auth-sessions.md`.

## 6. Manejo de errores y forma estándar de respuesta

Toda respuesta HTTP de la API — éxito o error — comparte el mismo esqueleto:

```json
// éxito (2xx)
{ "success": true, "statusCode": 200, "timestamp": "2026-09-01T02:34:17.725Z", "path": "/auth/login", "data": { } }

// error (4xx/5xx)
{ "success": false, "statusCode": 401, "timestamp": "2026-09-01T02:34:17.725Z", "path": "/auth/login", "error": "InvalidCredentialsException", "message": "..." }

// error con datos extra (solo si la excepción los trae)
{ "success": false, "statusCode": 422, "timestamp": "...", "path": "/auth/login", "error": "CompanySelectionRequiredException", "message": "...", "details": { "choices": [ ] } }
```

- `ResponseInterceptor` (`infrastructure/common/http/response.interceptor.ts`, global vía
  `APP_INTERCEPTOR` en `core.module.ts`) arma el envoltorio de éxito automáticamente — ningún
  controlador arma `{success, data, ...}` a mano. Un `204 No Content` (ej. logout) se deja
  pasar sin envolver: un 204 no debe llevar body.
- `GlobalExceptionFilter` (`infrastructure/common/http/global-exception.filter.ts`, global vía
  `APP_FILTER`) arma el envoltorio de error para **cualquier** excepción no atrapada: de
  dominio (`DomainException` → mapea `code` a status HTTP), de Nest (`HttpException`, ej.
  `ValidationPipe`), o un error técnico no controlado (500 genérico, sin filtrar detalles
  internos al cliente, pero logueado en el servidor). Las tres se ven idénticas desde afuera.
- El dominio lanza excepciones propias (`extends DomainException`), sin códigos HTTP — nunca
  arma la respuesta HTTP directamente.
- `DomainException` acepta un tercer parámetro opcional `details?: Record<string, unknown>`
  para excepciones que necesitan llevar datos estructurados que el cliente necesita para actuar
  (ej. `CompanySelectionRequiredException` lleva `{ choices }`). `GlobalExceptionFilter` lo
  agrega a la respuesta como campo `details` únicamente cuando está presente — genérico a
  propósito, para no tener que tocar el filtro cada vez que una excepción nueva necesite esto.
- Los adaptadores de salida (repositorios, clientes HTTP) no filtran errores técnicos hacia el
  dominio: los normalizan o los envuelven en excepciones de dominio/aplicación cuando aplica.
- No hay un campo `statusCode`/`success` redundante que el cliente tenga que reconciliar con el
  código HTTP real de la respuesta — siempre coinciden, porque ambos se calculan en el mismo
  lugar (`GlobalExceptionFilter`/`ResponseInterceptor` leen el status real de la respuesta).

### 6.1 Listas paginadas

Un `GET` que lista un recurso y puede crecer sin límite (ej. `GET /users`) **debe paginar**,
nunca devolver todo de una. El `meta` viaja al lado de `data`, no anidado adentro:

```json
{ "success": true, "statusCode": 200, "timestamp": "...", "path": "/users",
  "data": [ { } ], "meta": { "total": 42, "page": 1, "pageSize": 20 } }
```

- El controlador arma un `PaginatedResponseDto<T>` (`infrastructure/common/http/paginated-response.dto.ts`,
  `{ data, meta }`) y lo devuelve tal cual — no hace falta armar el envoltorio a mano.
  `ResponseInterceptor` lo detecta (tiene `data` + `meta`) y sube `meta` al nivel raíz, en vez
  de anidarlo dentro de `data` como pasaría con cualquier otro valor de retorno.
- El puerto de repositorio expone `findAllPaginated(params: PaginationParams):
  Promise<PaginatedResult<T>>` (`domain/common/paginated-result.ts` — contrato compartido, no
  se redefine por módulo), implementado en el adaptador con `findAndCount` de TypeORM
  (`skip`/`take`).
- Los query params (`page`, `pageSize`) se validan con un DTO propio del módulo (ej.
  `ListUsersQueryDto`) usando `@Type(() => Number)` de `class-transformer` — llegan como
  string en la URL, `ValidationPipe` (con `transform: true`) los convierte antes de validar
  con `@IsInt()`/`@Min()`/`@Max()`. `pageSize` siempre tiene un tope máximo (ej. 100) para que
  nadie pida la tabla entera en una sola página.

## 7. Transaccionalidad en los casos de uso

> Un caso de uso es una unidad de trabajo (Unit of Work) completa: **todo lo que escribe,
> se guarda o falla junto**.

- Si un caso de uso persiste más de una entidad relacionada (ej. cabecera + detalle,
  stock + movimiento, orden + pagos), **todas esas escrituras van dentro de una sola
  transacción**. Está prohibido abrir una transacción para la cabecera y otra distinta
  (o ninguna) para el detalle: si el detalle falla, la cabecera ya confirmada deja el
  sistema en un estado inconsistente. Esto es exactamente el error que **no** debe repetirse.
- La transacción se abre y cierra **en el borde del caso de uso** (capa `application`),
  nunca dentro de cada repositorio por separado. Un repositorio individual no hace
  `commit`/`rollback` por su cuenta: solo ejecuta su operación dentro del contexto
  transaccional que le llega.
- Puerto recomendado: `TransactionManager` (o `UnitOfWork`), definido como interfaz en
  `application` e implementado en `infrastructure` (ej. con `DataSource.transaction()` de
  TypeORM o `$transaction` de Prisma).

```ts
// application/create-order.use-case.ts
async execute(input: CreateOrderInput): Promise<OrderId> {
  return this.transactionManager.run(async (ctx) => {
    const order = Order.create(input);
    await this.orderRepository.save(order, ctx);          // cabecera
    for (const item of input.items) {
      await this.orderDetailRepository.save(order.id, item, ctx); // detalle
    }
    return order.id;
  });
  // si cualquier save falla, TODO se revierte: cabecera y detalle juntos
}
```

- Todos los repositorios invocados dentro de un mismo caso de uso deben usar el **mismo**
  `ctx`/`EntityManager` transaccional recibido; nunca crear uno nuevo por operación.
- Si un caso de uso llama a otro caso de uso (u orquesta varios pasos), deben propagar y
  compartir la misma transacción — no anidar transacciones independientes, salvo que se use
  deliberadamente un *savepoint* y quede documentado por qué.
- Regla de oro: **cabecera y detalle se guardan o fallan juntos, siempre dentro del mismo
  caso de uso y la misma transacción.**

## 8. Testing

- **Domain**: tests unitarios puros, sin mocks de framework, 100% aislados.
- **Application**: tests de casos de uso mockeando los puertos (interfaces), no las
  implementaciones concretas.
- **Infrastructure**: tests de integración (controladores con `supertest`, repositorios contra
  una base de datos real o en memoria/testcontainers).
- Un caso de uso debe poder testearse **sin levantar Nest** ni una base de datos.
- **Verificación manual/exploratoria de un CRUD completo** (crear→editar→eliminar via
  curl/Playwright, no un test automatizado): nunca contra la base de desarrollo real
  (`DB_NAME=RedPecuaria` del `.env`) — existe `RedPecuariaTest`, una base separada en el mismo
  Postgres, ya migrada, solo para esto. Ver `.env.test.example` para cómo levantar un backend
  efímero en otro puerto apuntando ahí, sin tocar el proceso de desarrollo real. Motivo: el
  borrado del sistema es lógico (`is_deleted`), no físico — datos de prueba escritos contra la
  base real quedan dando vueltas desactivados, no desaparecen.

## 9. Reglas de dependencias (resumen)

```
infrastructure  →  application  →  domain
      ↑                                 
      └── implementa puertos definidos en application/domain
```

- ✅ `infrastructure` puede importar de `application` y `domain`.
- ✅ `application` puede importar de `domain`.
- ❌ `domain` NO importa de `application` ni de `infrastructure`.
- ❌ `application` NO importa de `infrastructure` (ni siquiera tipos de NestJS como
  `Request`/`Response`, decoradores HTTP, entidades de ORM).
- ❌ Ningún caso de uso ni entidad de dominio importa `@nestjs/*` (excepto `@Injectable()`
  en casos de uso, que es tolerado por pragmatismo de DI, pero sin lógica de framework).

## 10. Checklist antes de abrir un PR

- [ ] ¿El dominio sigue sin importar nada de `infrastructure`?
- [ ] ¿El caso de uso depende de interfaces (puertos), no de clases concretas?
- [ ] ¿El controlador es delgado (sin lógica de negocio)?
- [ ] ¿Los DTOs HTTP están separados de las entidades de dominio, con su mapper?
- [ ] ¿Las excepciones de dominio se traducen a HTTP en el filtro, no en el controlador?
- [ ] ¿Hay tests unitarios del caso de uso mockeando los puertos?
- [ ] Si el caso de uso escribe más de una entidad (cabecera + detalle, etc.), ¿todas las
      escrituras ocurren dentro de **una sola transacción**, y no en transacciones separadas
      por entidad?
- [ ] Si el cambio toca una funcionalidad con doc en `docs/`, ¿se actualizó su estado actual,
      se agregó el archivo de cambio correspondiente en `changes/`, y la entrada en
      `CHANGELOG.md`? (ver §11)

## 11. Documentación viva, historial de cambios y changelog

> Regla absoluta: **todo fix o cambio actualiza estos archivos de contexto.** No es opcional
> ni se pospone — un fix que no actualiza su documentación queda incompleto.

Cada funcionalidad de negocio (no cada archivo de código) tiene su propia carpeta en `docs/`:

```
docs/<funcionalidad>/
  <funcionalidad>.md       # estado actual — se edita in-place
  changes/
    YYYY-MM-DD-slug.md     # un archivo por cambio — nunca se edita después de creado
```

- **`<funcionalidad>.md`** (estado actual): descripción, reglas de negocio vigentes, diagrama
  (Mermaid) y estado de implementación. Siempre refleja la realidad de HOY. Termina con una
  sección **"Últimos cambios"** que enlaza a los 2-3 archivos más recientes de `changes/`.
- **`changes/YYYY-MM-DD-slug.md`** (un archivo por cambio, inmutable): qué cambió, el motivo,
  qué había antes, y **rama + commit(s)** asociados (para poder ir directo al diff real). Si el
  archivo se escribe antes de commitear, el campo de commit se completa apenas se hace el
  commit — esa es la única edición permitida sobre un archivo de `changes/` ya creado.
- El historial completo de una funcionalidad es, literalmente, la lista de archivos en su
  carpeta `changes/`, ordenados por nombre (fecha). No se acumula todo en un único archivo que
  crece sin límite.

**`CHANGELOG.md`** (raíz del proyecto): registro cronológico de qué se implementó a nivel
código (formato Keep a Changelog, agrupado en `Unreleased` mientras no haya versiones). Es el
complemento técnico del "por qué" que vive en `docs/`.

**Cuándo actualizar qué:**
- Se completa una fase de un plan aprobado → actualizar `<funcionalidad>.md` (estado +
  últimos cambios), agregar su archivo en `changes/`, y agregar la entrada en `CHANGELOG.md`.
- Se hace un **fix** (de cualquier tamaño) sobre una funcionalidad ya documentada → mismo
  proceso: nuevo archivo en `changes/` de esa funcionalidad + entrada en `CHANGELOG.md`. No
  hay excepción por ser "solo un fix".
- Cambia una regla de negocio → igual que arriba, y además se actualiza la sección de reglas
  de negocio en `<funcionalidad>.md`.

## 12. Entornos y despliegue

Tres bases de datos posibles, nunca mezcladas:

| Entorno | Base | `.env` | Uso |
|---|---|---|---|
| Desarrollo local | Postgres local, `RedPecuaria` | El `.env` de siempre, sin tocar | Trabajo diario (`npm run start:dev`) |
| Verificación manual de un CRUD | Postgres local, `RedPecuariaTest` | Variables de shell antepuestas al comando (ver `.env.test.example`) | Round-trips create/editar/eliminar sin ensuciar la base real — ver §8 |
| Producción | Neon (Postgres administrado) | Variables de shell antepuestas (uso puntual, ej. migraciones) **o** dashboard de Render (la app desplegada) | La app real, accesible desde internet |

En los tres casos es la **misma** variable (`DB_HOST`, `DB_NAME`, etc.) — lo que cambia es de
dónde sale su valor en cada momento, nunca el archivo `.env` en sí:

- **Local**: valores fijos en `.env` (gitignoreado).
- **Un comando puntual contra otra base** (test o Neon): las variables se anteponen al comando
  en el shell — dotenv no pisa una variable ya seteada en el entorno, así que ganan sobre lo
  que diga `.env`, solo para esa ejecución. Nunca se edita `.env` para esto. Ver
  `.env.test.example` / `.env.neon.example`.
- **Render (producción desplegada)**: las variables se cargan en el dashboard de Render
  ("Environment"), nunca en un archivo — no existe ningún `.env` en el servidor. Nest lee
  `process.env` directo (`ConfigModule.forRoot` no necesita que exista un archivo `.env` para
  funcionar).

**`DB_SSL=true`** (además de las 5 variables de conexión de siempre): necesario contra
cualquier Postgres administrado (Neon, el Postgres de Render, Supabase) — exigen SSL con un
certificado que Node no reconoce por default, de ahí el `rejectUnauthorized: false` en
`app.module.ts`/`data-source.ts`. En local queda en `false` (o sin setear), sin cambios.

Stack de despliegue elegido (gratis): **Vercel** (frontend Next.js) + **Render** (backend,
free tier con sleep tras 15 min de inactividad) + **Neon** (Postgres, sin fecha de expiración
— a diferencia del Postgres gratis de Render, que borra la base a los 30 días).

**Migraciones en producción — `migrationsRun: true`** (`app.module.ts`, `TypeOrmModule.
forRootAsync`), mismo criterio que Flyway en Spring Boot: corren automáticamente **al
establecer la conexión, en cada arranque del proceso** (deploy nuevo, o el proceso despertando
del sleep del free tier de Render) — antes de que la app empiece a recibir tráfico. Si una
migración falla, la app no llega a arrancar (mejor eso que servir tráfico contra un esquema
desactualizado). Necesita también `migrations: [join(__dirname, 'migrations/*{.ts,.js}')]` —
el glob con `__dirname` sirve para los dos entornos sin duplicar config: en desarrollo (`nest
start`, vía ts-node) `__dirname` resuelve a `src/` y matchea los `.ts`; ya compilado (`node
dist/main`) resuelve a `dist/` y matchea los `.js`. Verificado en los dos modos contra
`RedPecuariaTest`: revirtiendo una migración a mano (`migration:revert`) y arrancando el
proceso (compilado y en modo `nest start`), confirmando que la vuelve a aplicar sola sin correr
ningún comando.

**Iteraciones previas, descartadas** (documentadas para que quede el motivo de cada una):
1. **"Pre-Deploy Command" de Render** (`npm run migration:run`, corre una sola vez por deploy)
   — descartada **al intentar configurarla**: esa función es solo para instancias pagas
   ("Pre-Deploy Command is available for paid instances only"), y el plan usado es el free
   tier. Nunca llegó a correr — causó un 500 real en producción (`GET
   /dashboard/admin-summary`, columnas de una migración que nunca se aplicó contra Neon).
2. **Encadenar la migración al propio `start:prod`**
   (`"start:prod": "npm run migration:run && node dist/main"`) — funcionaba (verificado), pero
   requería mover `ts-node`/`tsconfig-paths`/`typescript` de `devDependencies` a `dependencies`
   (el CLI de TypeORM ejecuta los `.ts` de `src/migrations/` directo, necesita esos paquetes en
   producción). Se descartó en favor de `migrationsRun: true`, que no necesita nada de eso —
   corre contra los `.js` ya compilados, usando la misma conexión que ya arma la app.
3. **Dejarlo 100% manual para siempre** — obliga a acordarse de correr el comando a mano en
   cada deploy que agregue una migración (la causa raíz del incidente de arriba).

**Caveat conocido de `migrationsRun: true`** (no aplica hoy, sí si se escala): a diferencia de
Flyway, TypeORM no tiene un lock de fila que impida que dos instancias corran migraciones al
mismo tiempo — con más de una instancia del backend arrancando a la vez, podría haber una
condición de carrera. El free tier de Render solo permite una instancia, así que hoy no es un
riesgo real; revisar si el plan cambia. Ninguna corrida de migración contra una base real (Neon
o la de desarrollo) se hace sin confirmación explícita — ver `.env.neon.example`.
