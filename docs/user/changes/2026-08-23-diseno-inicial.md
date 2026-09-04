# 2026-08-23 — Diseño inicial

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se define `User` como identidad de una persona: email (único global), contraseña hasheada,
nombre completo, estado activo/inactivo. Explícitamente no conoce empresas ni roles.

## Motivo

Separar "quién es la persona" (User) de "qué puede hacer y dónde" (UserCompany + Role), para
que una misma identidad pueda participar en varias empresas sin duplicar datos de la persona.

## Qué había antes

N/A — es el diseño inicial de este concepto.
