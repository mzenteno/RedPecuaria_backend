# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define la estrategia de sesión: JWT de acceso de corta duración + refresh token opaco,
persistido hasheado (SHA-256) y revocable, con rotación en cada uso y detección de reuso.

## Motivo

Se necesitaba poder revocar sesiones (logout real, invalidar ante robo de token), lo cual un
único JWT de larga duración sin persistencia no permite. Se eligió esta estrategia frente a la
alternativa de "solo access token" por ese motivo.

## Qué había antes

N/A — es el diseño inicial de este concepto.
