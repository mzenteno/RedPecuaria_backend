# 2026-09-04 — Diseño e implementación inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Primer módulo del negocio ganadero en sí (todo lo anterior era administración/plataforma):
tabla `properties` (empresa, nombre único por empresa, latitud/longitud), dominio +
persistencia + casos de uso CRUD completos, `PropertyController`, y la pantalla
`app/(main)/properties` en el frontend con selector de ubicación por mapa (Leaflet +
OpenStreetMap, sin API key). Migración `AddPropertyInvestmentKardex` (junto con `investments`,
`investment_investors`, `kardex_entries` — ver `docs/investment/investment.md`).

## Motivo

Arranque del módulo de negocio (fincas, inversiones ganaderas, kardex de inventario), a pedido
explícito del usuario, basado en una planilla de Kardex real que usan hoy en Excel. Alcance
deliberadamente acotado ("Fase 1"): solo carga de datos, sin ningún cálculo automático (ver
`docs/investment/investment.md` para el detalle completo de las decisiones de alcance).

## Qué había antes

No existía ningún concepto de negocio ganadero en el sistema — solo el módulo `auth`
(empresas, usuarios, roles, permisos).
