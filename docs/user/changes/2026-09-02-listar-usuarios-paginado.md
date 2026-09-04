# 2026-09-02 — Listado de usuarios paginado

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `GET /users?page=&pageSize=` — no existía ningún endpoint para listar usuarios. Es
el primer `GET` de lista del proyecto que pagina, y establece el patrón para el resto (ver
ARCHITECTURE.md §6.1):

- `UserRepository.findAllPaginated(params)` (puerto) + implementación con `findAndCount` de
  TypeORM (`ORDER BY created_at DESC`).
- `PaginatedResult<T>`/`PaginationParams` — contrato de dominio compartido
  (`domain/common/paginated-result.ts`), no específico de `User`, pensado para reusarse en
  cualquier otra lista que necesite paginar más adelante.
- `ListUsersUseCase` (nuevo).
- `ListUsersQueryDto` — valida `page`/`pageSize` de los query params (llegan como string,
  `@Type(() => Number)` de `class-transformer` los convierte antes de `@IsInt()`/`@Min()`).
  `pageSize` tope 100.
- `PaginatedResponseDto<T>` (`infrastructure/common/http/`) + se amplió `ResponseInterceptor`
  para reconocer esta forma (`{ data, meta }`) y subir `meta` al nivel raíz del envoltorio en
  vez de anidarlo dentro de `data`.

Verificado contra la app real: sin query (defaults 1/20) trae todo; `page=1&pageSize=2` y
`page=2&pageSize=2` no se superponen; `page=0` rechaza con 400 antes de llegar al caso de uso.

## Motivo

Pedido explícito: se necesita listar usuarios, y debe venir paginado desde el principio (no
se agrega después) — la respuesta ya soporta `meta.total/page/pageSize` sin que el frontend
tenga que adivinar cuándo se agregó paginación a cada endpoint.

## Qué había antes

No existía ningún endpoint para listar usuarios, ni ningún endpoint de lista del proyecto
paginaba — todos devolvían el array completo (`companies`, `roles`, etc.), aceptable hoy con
poco volumen de datos, pero documentado como gap conocido.
