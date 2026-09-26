# Logo de empresa (subida, almacenamiento y listado)

**Estado:** ✅ implementado, 2026-09-26.

## El pedido

> "este es el logo de una empresa, necesito agregar el logo de la empresa en la tabla para
> después colocarla en el reporte pdf del kardex"

Se agregó la capacidad de subir/quitar un logo por empresa — **la parte de estamparlo en el PDF
del Kardex** se hizo en un pedido posterior, el mismo día, ver
[2026-09-26-logo-en-pdf-kardex.md](./2026-09-26-logo-en-pdf-kardex.md). El logo NO se muestra en
el listado de Empresas (se probó y se sacó a pedido del usuario) — solo en el diálogo de edición
y, ahora, en el PDF.

## Decisión: almacenamiento propio en disco local, sin dependencias externas

El proyecto no tenía NINGUNA infraestructura de subida de archivos (ni multer configurado, ni
archivos estáticos servidos, ni variables de entorno de storage) — se armó desde cero. Se evaluó
disco local vs. un bucket externo (S3/Cloudinary/etc.) y se eligió disco local:
- Es un proyecto de un solo servidor (Render), sin necesidad hoy de CDN ni de multi-instancia.
- No agrega credenciales ni dependencias de un proveedor externo para algo tan chico como el
  logo de una empresa.
- Si en el futuro hace falta migrar a un bucket, el cambio queda contenido en un solo archivo
  (`LocalFileStorageAdapter`) — el resto del sistema habla contra el puerto `FileStorage`, no
  contra "disco" directamente (ver más abajo).

## Qué cambió — Backend

**Nuevo puerto** `FileStorage` (`domain/core/ports/file-storage.port.ts`, símbolo
`FILE_STORAGE`) — mismo patrón que `PasswordHasher`/`TokenGenerator`: el dominio/aplicación solo
sabe que puede `save(folder, file)` y `remove(url)`, no de qué está hecho el almacenamiento real.

**Adaptador** `LocalFileStorageAdapter` (`infrastructure/core/storage/`) — guarda en
`<cwd>/uploads/<folder>/<uuid>.<ext>` (nunca el nombre original del archivo: evita colisiones y
cualquier caracter raro que traiga) y devuelve una URL **absoluta**
(`APP_BASE_URL` + `/uploads/...`, nueva variable de entorno) — una URL relativa la resolvería el
FRONTEND contra su propio origen, no el de esta API (dominios distintos en local:
`localhost:3010` vs `localhost:3001`). Registrado en `CoreModule` (`@Global()`, mismo lugar que
el resto de los servicios singleton de infraestructura).

**Servido de vuelta**: `ServeStaticModule.forRoot({ rootPath: '<cwd>/uploads', serveRoot:
'/uploads' })` en `AppModule` — nuevo paquete `@nestjs/serve-static` (fijado a `^5.0.5`, la única
versión compatible con Nest 11 + Express 5 de este proyecto; la última publicada exige Nest 12).
Es middleware de Express montado directo, corre ANTES del pipeline de guards de Nest — no hace
falta `@Public()` en ningún controlador para esto, y es la elección correcta: un logo es
contenido público por naturaleza (se muestra en un `<img>` o, más adelante, en un PDF, sin
token). Se prefirió este paquete oficial a mano-rolear un controlador con `res.sendFile()`
porque ese camino exige validar a mano que `folder`/`filename` no contengan `../` (path
traversal) — un paquete ya auditado para exactamente este propósito es más seguro que
reinventarlo.

**`uploads/`** — nunca se commitea (`.gitignore`), vive fuera de `dist`/`src` a propósito
(`process.cwd()`, no `__dirname`): un archivo subido en runtime no puede depender de una carpeta
que un build vuelve a borrar y reconstruir.

**Migración** `AddLogoUrlToCompanies` — columna `logo_url varchar(500)`, nullable (la mayoría de
las empresas arrancan sin logo).

**`Company` (dominio)** — `logoUrl: string | null` + `updateLogo(logoUrl)`. La entidad no sabe
nada de archivos, solo guarda la URL resultante — quien orquesta guardar/borrar el archivo real
es el caso de uso.

**Dos casos de uso nuevos**:
- `UpdateCompanyLogoUseCase` — sube el archivo nuevo primero, recién después actualiza
  `logoUrl` y guarda, y solo al final borra el archivo anterior (si había). Ese orden importa: si
  falla el guardado en disco, la empresa queda como estaba; si falla el `save()` en base, no se
  perdió el archivo viejo (todavía referenciado).
- `RemoveCompanyLogoUseCase` — mismo criterio, pone `logoUrl = null` y borra el archivo después
  de confirmar el `save()`.

**`CompanyController`** — dos endpoints nuevos:
- `POST /companies/:id/logo` (`multipart/form-data`, campo `file`) — `FileInterceptor` con
  `memoryStorage()` explícito (aunque sea el default de multer sin `dest`/`storage`, se hizo
  explícito a propósito: `file.buffer` en vez de un path en disco temporal es intencional, no un
  detalle a memorizar) y `fileFilter` que rechaza cualquier mimetype que no sea
  `image/png|jpeg|webp|svg+xml` ANTES de leerlo en memoria. Límite de 2 MB (`limits.fileSize`).
- `DELETE /companies/:id/logo` — devuelve la empresa actualizada (no un 204), para que el
  frontend pueda refrescar la vista previa sin depender de que el listado ya se haya vuelto a
  pedir.

**`CompanyResponseDto`/`CompanyMapper`** — agregan `logoUrl`.

## Qué cambió — Frontend

**`http-client.ts`** — nuevo `httpClient.postForm()` para subir archivos; `requestEnvelope` ya no
fija `Content-Type: application/json` a mano cuando el body es un `FormData` (el navegador arma
su propio header con el boundary multipart — fijarlo a mano lo rompe).

**Módulo `company`** (mismo patrón por-caso-de-uso que ya tenía el resto de este módulo, no el
patrón `features/` más nuevo usado en Inversiones — se respetó la convención YA establecida en
este módulo puntual): `Company.logoUrl`, `CompanyRepository.uploadLogo()/removeLogo()`, dos
nuevas interfaces de caso de uso (`UploadCompanyLogoUseCase`/`RemoveCompanyLogoUseCase`) + sus
impls + wiring en `company.container.ts` + `useCompanies()`.

**`CompanyDialog`** — sección "Logo" **solo en modo edición** (mismo criterio que "Estado" en
`InvestmentDialog`: no tiene sentido antes de que la empresa exista, `POST .../:id/logo` necesita
un id real). Es una acción INDEPENDIENTE del botón "Guardar" del formulario — sube apenas se
elige el archivo, con su propio estado de carga/error, en vez de ser un campo más que viaja junto
con `name`. Se decidió así para no tener que encadenar "crear la empresa → recién ahí subir el
logo" (dos pasos con dos puntos de falla distintos) ni dejar un archivo elegido "pendiente" si el
usuario cierra el diálogo sin guardar el nombre. Valida tipo (PNG/JPG/WEBP/SVG) y tamaño (2 MB)
en el cliente ANTES de subir, mismo límite que el backend (evita el viaje de red para un archivo
que el backend va a rechazar igual).

**`CompanyTable`**: sin cambios — el logo no se muestra en el listado (a pedido del usuario), solo
en el diálogo de edición. Queda disponible por `company.logoUrl` para quien lo necesite (ej. el
reporte PDF del Kardex, el trabajo pendiente).

## Verificado

`tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en vivo, a pedido del
usuario (ver memoria del proyecto: no levantar backend/frontend para verificar). La subida real
de un archivo y su render en pantalla quedan sin probar en este pase — si algo no calza al
usarlo de verdad (ej. `APP_BASE_URL` mal configurado en el `.env` real), avisar.
