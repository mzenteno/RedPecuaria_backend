# 2026-09-05 — Paginación de servidor en Inversiones (3 variantes) y Kardex

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Regla del proyecto: paginación de servidor para **todo** excepto Empresas/Roles/Permisos (ver
`frontend/ARCHITECTURE.md` §8/§9). `Properties`, las 3 variantes de `Investments` y `Kardex`
habían quedado fuera de esa regla por error — este cambio los lleva al mismo patrón que
`Users`: `PaginationParams`/`PaginatedResult<T>` en el dominio, `createQueryBuilder` +
`.andWhere()` condicional por filtro + `.skip()/.take()/.getManyAndCount()` en el adaptador,
`PaginatedResponseDto<T>` levantado a `{data, meta}` por el `ResponseInterceptor`,
`httpClient.getPaginated<T>()` + `placeholderData: keepPreviousData` (React Query) del lado del
cliente, buscador con debounce de 300ms.

- `GET /investments/mine`, `/investments/by-gestion` y `/investments/by-investor` ahora reciben
  `page`/`pageSize` y devuelven `PaginatedResponseDto` (antes la lista completa de una).
  `ListInvestmentsByGestionUseCase`/`ListInvestmentsByInvestorUseCase` extienden
  `PaginationParams`; `InvestmentRepository.findActiveByCompanyAndGestion`/`findByInvestor`
  reciben `page`/`pageSize` además de sus filtros existentes (`propertyId`, `investorUserId`,
  `search`).
- Como consecuencia, "Propiedad" e "Inversionista" en `app/(main)/investments` dejaron de ser
  `.filter()` del lado del cliente sobre la lista ya traída — ahora viajan como parámetros de la
  misma consulta de servidor. Con una paginación real, filtrar solo la página ya descargada
  daría resultados incompletos (el match podía estar en otra página). Cambiar cualquiera de los
  tres filtros resetea la página a 1.
- `GET /kardex-entries?investmentId=` ahora pagina (`ListKardexEntriesByInvestmentUseCase`,
  `KardexEntryRepository.findActiveByInvestment`) y agrega búsqueda de servidor por `detail`
  (antes un `.filter()` en el cliente sobre la lista completa de movimientos de la inversión).
- `app/(main)/kardex` termina con **dos** paginaciones de servidor independientes en la misma
  pantalla: "Mis inversiones" (`GET /investments/mine`) y, una vez elegida una inversión, sus
  movimientos de kardex (`GET /kardex-entries`) — cada una con su propio estado de página y su
  propio `<Pagination>`.
- `GET /properties` ahora recibe `page`/`pageSize`/`search` (`ListPropertiesByCompanyUseCase`,
  `PropertyRepository.findAllPaginated`) para la pantalla CRUD de Propiedades. Los combobox de
  Propiedad en Inversiones/Kardex no usan ese hook — usan uno aparte sin paginar,
  `usePropertyOptions()` (hasta 100 registros de una, mismo criterio que `useInvestorUsers()`),
  porque un `<select>` no puede "pasar de página".

## Motivo

Corrección de una regla ya decidida (paginación de servidor para todo salvo Empresas/Roles/
Permisos), que se había documentado como excepción válida para Propiedades e Inversiones por
copiar el razonamiento de esos 3 catálogos chicos ("un puñado de registros, no hace falta") sin
que aplicara — quedó marcado como deuda pendiente en los propios comentarios de
`useProperties()`/`useMyInvestments()` hasta que el usuario lo señaló explícitamente y pidió
implementarlo.

## Qué había antes

`GET /properties`, `GET /investments/mine`, `GET /investments/by-gestion`,
`GET /investments/by-investor` y `GET /kardex-entries?investmentId=` devolvían la lista
completa de una — sin `page`/`pageSize`, sin `meta`. El frontend paginaba y/o filtraba del lado
del cliente sobre esa lista completa (`hooks/use-client-pagination.ts` en Propiedades, y
`.filter()` manual en Inversiones/Kardex para "Propiedad"/"Inversionista"/búsqueda).
