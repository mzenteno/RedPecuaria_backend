# 2026-09-04 — Mapa de ubicación más grande

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

`LocationMapPicker`: 260px → 520px de alto, zoom inicial 13 → 15 (casi a nivel de calle).
`PropertyDialog`: el panel del diálogo ensancha a `64rem` (el resto de los diálogos del
proyecto usa el `max-w-md` por defecto, 28rem).

## Motivo

A pedido del usuario: la versión chica no daba suficiente precisión para marcar la ubicación
con el mouse.

## Qué había antes

Mapa de 260px de alto, zoom 13, dentro de un diálogo con el ancho por defecto (`max-w-md`,
28rem) — el mismo que usan Empresas/Usuarios/Roles.
