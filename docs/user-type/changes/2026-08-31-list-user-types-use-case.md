# 2026-08-31 — Caso de uso de solo lectura

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `ListUserTypesUseCase` en `application/user/use-cases/`, que solo expone
`UserTypeRepository.findAll()`. No hay CRUD porque no está planeado (catálogo fijo, sembrado
por migración) — este caso de uso existe únicamente para poblar el combo de tipo de usuario en
el alta de `User` (`RegisterUserUseCase`).

## Motivo

`RegisterUserUseCase` (Fase 5 de `user`) necesita listar los tipos de usuario disponibles.

## Qué había antes

Solo existía el dominio y la persistencia de `UserType` (Fase 3), sin ningún caso de uso.
