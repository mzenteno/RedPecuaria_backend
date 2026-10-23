# 2026-10-23 — Contorno (perímetro) de la propiedad

**Rama:** main
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- **`properties.boundary` (`jsonb`, nullable)**: migración `AddBoundaryToProperties`. Lista de
  vértices `{ lat, lng }`. El polígono se cierra solo: el último no repite al primero.
- **`Property.boundary`** (dominio): opcional en `create()`/`update()`. En `update()`,
  `undefined` lo deja como está (mobile todavía no lo edita y no lo manda) y `null` lo borra.
  Con menos de 3 puntos → `InvalidPropertyBoundaryException` (400).
- **DTOs** de alta/edición: `boundary?: { lat, lng }[] | null`, 3 a 1000 vértices, cada uno
  validado con `@IsLatitude()`/`@IsLongitude()`. `PropertyResponseDto` lo devuelve.
- **Frontend**: `LocationMapPicker` pasa a ser `PropertyMapEditor`, con dos modos:
  "Ubicación" (el punto de siempre) y "Contorno" (clic agrega vértice, vértices arrastrables,
  deshacer y borrar). Capa satelital por defecto (Esri World Imagery) con OpenStreetMap como
  alternativa. La superficie en hectáreas se muestra en el diálogo y en una columna nueva
  "Superficie" de la tabla (`lib/polygon-area.ts`).

## Motivo

El usuario quería marcar las dimensiones de la propiedad, no solo un punto.

## Decisiones de diseño

- **Solo el contorno**: los lotes/potreros internos quedan para un módulo aparte si se piden.
- **El punto se marca aparte**: el usuario prefirió mantenerlo independiente del contorno (ej.
  para marcar la entrada) en vez de calcularlo como el centro del polígono.
- **`jsonb` y no PostGIS**: no hay consultas espaciales, solo se guarda y se dibuja.
- **Superficie calculada en el frontend**, no guardada: es derivada del contorno y la fórmula
  esférica (la misma de Leaflet.draw) tiene un error < 0,5 % para una finca.
