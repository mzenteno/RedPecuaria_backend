# 2026-09-02 — Controladores CRUD + CORS

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

Se agregó `CompanyController` (`infrastructure/company/http/`) exponiendo los 4 casos de uso
ya existentes (`POST /companies`, `PATCH /companies/:id`, `PATCH /companies/:id/deactivate`,
`GET /companies`), con `CreateCompanyRequestDto`/`UpdateCompanyRequestDto`/`CompanyResponseDto`
y `CompanyMapper`. Protegido por defecto por `JwtAuthGuard` (Fase 9) — sin autorización por
permiso todavía. De paso se agregó CORS global (`app.enableCors()` en `main.ts`, variable
`CORS_ORIGIN` en `.env`/`.env.example`), necesario para que cualquier frontend en otro origen
pueda llamar a la API.

Verificado contra la app real: sin token → 401; crear y listar empresas funciona; preflight
CORS (`OPTIONS`) responde con los headers correctos.

## Motivo

Con el guard ya implementado (Fase 9), correspondía exponer los casos de uso de `company` que
llevaban desde la Fase 4 sin ningún controlador — junto con los del resto de módulos
(`role`, `user`, `user-type`, `permission`, `user-company`), este es el primer conjunto de
endpoints de negocio protegidos del proyecto (además de `auth-sessions`/`me`).

## Qué había antes

Los casos de uso existían (Fase 4) pero sin ningún endpoint HTTP.
