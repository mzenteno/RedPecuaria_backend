# 2026-09-08 — `movement_type` pasa a ser una tabla propia (`kardex_movement_types`), no un string

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **Tabla nueva `kardex_movement_types`** (id, name, is_deleted, created_at — igual forma que
  `user_types`), sembrada por migración con las 3 filas fijas: `ingreso`, `venta`, `baja`. Sin
  CRUD propio, solo `GET /kardex-movement-types` para listar.
- **`kardex_entries.movement_type` (varchar) → `movement_type_id` (bigint, FK)** — migración
  `AddKardexMovementTypesTable`, con backfill real de los datos existentes (a diferencia del
  cambio de saldo anterior: acá sí importaba no perder qué tipo era cada fila ya cargada).
- **`MovementType`** (dominio nuevo, `domain/kardex/entities/movement-type.ts`) — mismo patrón
  que `UserType`: `isIngreso()`/`isVenta()`/`isBaja()` comparan `name` contra constantes fijas.
  `MovementTypeRepository` (`findById`/`findAll`/`save`) y su adapter TypeORM, igual forma que
  `UserTypeRepository`.
- **`KardexEntry.movementType` (string) → `movementTypeId` (string, FK plano)** — igual criterio
  que `User.userTypeId`: la entidad no carga el objeto `MovementType` completo, solo su id.
- **`Create/UpdateKardexEntryUseCase`** resuelven el `MovementType` con
  `movementTypeRepository.findById(movementTypeId)` (`MovementTypeNotFoundException` si no
  existe) — la existencia ya no se valida con un `@IsIn` en el DTO, se valida en el caso de uso
  contra la tabla real, igual que `userTypeId` en `RegisterUserUseCase`.
- **`assertKardexInvestor`/`computeMovementDelta`** reciben el `MovementType` ya resuelto (no un
  string ni un id) y usan `.isVenta()`/`.isIngreso()`/`.isBaja()` en vez de comparar contra
  literales.
- **`KardexEntryRepositoryAdapter.findActiveByInvestment`**: el filtro de privacidad
  (`restrictSalesToInvestorId`) hace `INNER JOIN kardex_movement_types` para poder seguir
  comparando por nombre (`movementType.name != 'venta'`) — antes comparaba directo contra la
  columna de texto.
- **`DashboardRepositoryAdapter`**: `sumSales`/`getTopInvestors`/`getRecentMovements` agregan el
  mismo join — filtraban/mostraban `entry.movement_type` directo, esa columna ya no existe.
- **DTOs**: `Create/UpdateKardexEntryRequestDto.movementType` (`@IsIn`) → `movementTypeId`
  (`@IsString`/`@MinLength(1)`, existencia validada en application). `KardexEntryResponseDto`
  devuelve `movementTypeId`, no el nombre.

## Motivo

El comentario original de `KardexEntry.movementType` decía "catálogo fijo, no administrable,
igual criterio que `UserType`" — pero `UserType` es una tabla con FK, y `movementType` era un
`varchar(20)` con el texto literal directo en la fila. El usuario notó la inconsistencia: no
tenía sentido guardar el texto de la transacción repetido en cada fila en vez de una referencia
a un catálogo, exactamente lo que se decía estar siguiendo como criterio.

## Decisiones de diseño

- **Se replicó el patrón de `UserType` al detalle**: mismas columnas, mismo criterio de "catálogo
  cerrado sembrado por migración, sin CRUD, solo listar", mismos nombres de método
  (`isX()` en vez de comparar strings sueltos en cada lugar que lo necesita).
- **`assertKardexInvestor`/`computeMovementDelta` reciben el objeto ya resuelto, no vuelven a
  consultar la tabla** — quien llama (los 3 casos de uso de Kardex) ya lo resolvió una vez para
  la validación de existencia, se reusa esa misma instancia.
- **Con backfill de datos**, a diferencia de `MoveKardexBalanceToInvestment` (el cambio anterior,
  sin migrar datos porque el saldo era un valor derivable/reseteable) — acá el tipo de cada
  movimiento es un dato de negocio real que no se puede perder ni volver a calcular.

## Qué había antes

`kardex_entries.movement_type` era un `varchar(20)` con el texto literal, validado en el DTO con
un `@IsIn(['ingreso', 'venta', 'baja'])` (constante `KARDEX_MOVEMENT_TYPES` en el propio
`kardex-entry.ts`). Verificado en vivo contra `RedPecuariaTest`: la migración corrió sin errores
sobre datos reales (incluidas filas de pruebas anteriores en esta misma sesión), el backfill
mapeó correctamente cada fila existente a su id nuevo (`GET /kardex-entries` mostró los
`movementTypeId` correctos), se confirmó el rechazo de un `movementTypeId` inexistente
(`404 MovementTypeNotFoundException`), y se repitió el ciclo completo (crear Ingreso/Venta/Baja,
editar el tipo de un movimiento existente, desactivar) con el saldo de la inversión actualizándose
igual que antes del cambio. `GET /dashboard/admin-summary` siguió devolviendo `movementType` como
texto legible en "Últimos movimientos" (ahora resuelto vía join, no columna directa).
