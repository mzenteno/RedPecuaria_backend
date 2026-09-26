# El logo de empresa se guarda en base64 en la base, no en disco

**Estado:** ✅ implementado, 2026-09-26. Reemplaza el mecanismo de almacenamiento descripto en
[2026-09-26-logo-de-empresa.md](./2026-09-26-logo-de-empresa.md) (disco local + `ServeStaticModule`
+ `APP_BASE_URL`) — la subida/validación/UI del diálogo de ESE documento siguen vigentes tal
cual, solo cambió dónde vive la imagen.

## El problema encontrado en producción

Recién desplegado a Render, el logo se subía bien (`POST /companies/:id/logo` devolvía 201), pero
al mostrarlo la imagen no cargaba (`NS_ERROR_...` en el navegador). El diagnóstico, con las
DevTools abiertas: la URL guardada apuntaba a `http://localhost:3010/...`, porque `APP_BASE_URL`
no estaba seteada en el entorno de Render y caía al default de desarrollo.

Arreglar eso (setear `APP_BASE_URL` a la URL pública real del backend en Render) hubiera resuelto
el síntoma inmediato, pero no el problema real: **el disco local de un servicio web de Render es
efímero** — todo lo escrito ahí (el archivo del logo, en este caso) se pierde en cada deploy y en
cada reinicio del servicio, salvo que se pague un "Disk" persistente (feature de un plan pago).
El diseño anterior, aunque correcto en un servidor propio con disco persistente, no es viable en
la infraestructura real de este proyecto sin ese costo extra.

## Decisión: base64 en la propia fila de `companies`

Se plantearon 3 caminos (ver el detalle de cada uno en el resto de este documento) y el usuario
eligió el más simple: guardar la imagen misma, codificada en base64, directo en `logo_url` — sin
ningún archivo, ningún disco, ningún storage externo. Motivo explícito: no depender de un
proveedor externo ni de un plan pago de Render para algo tan chico como un logo, dado que ya se
tiene Postgres.

**Trade-off aceptado, no ignorado**: cada logo pesa hasta ~2,7 MB de texto en la fila (2 MB de
imagen × ~4/3 de overhead de base64) — y `GET /companies` (que trae TODAS las filas activas para
Super Administrador) ahora transfiere ese peso completo por cada empresa con logo, en cada
pedido. Es un costo aceptable dado que el propio `docs/company/company.md` ya documenta que se
espera "un puñado" de empresas, no cientos — si eso cambiara, o si los logos empezaran a pesar
mucho más, el camino correcto sería separar `logoUrl` de la respuesta general de `GET /companies`
(un endpoint aparte, `GET /companies/:id/logo`, pedido solo cuando hace falta) en vez de volver a
disco/storage externo.

## Qué se sacó (quedó sin nada que lo reemplace, porque ya no hace falta)

- El puerto `FileStorage` (`domain/core/ports/file-storage.port.ts`) y su adaptador
  `LocalFileStorageAdapter` (`infrastructure/core/storage/`) — borrados. Guardar/quitar un logo ya
  no orquesta ningún archivo externo, así que no hay nada que abstraer detrás de un puerto.
- `ServeStaticModule` (`AppModule`) y el paquete `@nestjs/serve-static` — desinstalado. Ya no hay
  ningún archivo en disco que servir en `/uploads/**`.
- La variable de entorno `APP_BASE_URL` (`.env`/`.env.example`) — ya no hace falta armar ninguna
  URL absoluta: el `data:` URI ES la imagen, no un puntero a otra parte.
- La carpeta `uploads/` y su entrada en `.gitignore`.

## Qué cambió

**Migración nueva** `ChangeCompanyLogoUrlToText` — `logo_url` pasa de `varchar(500)` (alcanzaba
para una URL) a `text` (sin límite práctico, hace falta para ~2,7 MB de base64). Migración
NUEVA, no se editó `AddLogoUrlToCompanies` (ya corrida en producción — nunca se edita una
migración ya aplicada en un entorno compartido).

**`CompanyEntity.logoUrl`** — `type: 'varchar', length: 500` → `type: 'text'`.

**`UpdateCompanyLogoUseCase`** — ya no depende de `FileStorage`. Arma el `data:` URI directo:
```ts
const logoUrl = `data:${input.file.mimeType};base64,${input.file.buffer.toString('base64')}`;
company.updateLogo(logoUrl);
return this.companyRepository.save(company);
```
Un solo `save()`, sin el orden "subir → guardar → borrar viejo" del diseño anterior — ya no hay
ningún archivo externo que gestionar, así que ya no hace falta esa coreografía.

**`RemoveCompanyLogoUseCase`** — mismo criterio, ya no depende de `FileStorage`: solo pone
`logoUrl = null` y guarda.

**`CompanyController.uploadLogo`** — sin cambios en la validación (multer, `memoryStorage()`,
límite de 2 MB, `fileFilter` de mimetypes) — solo cambió qué le pasa al caso de uso (`{buffer,
mimeType}`, ya no hace falta `originalName`: no hay archivo al que ponerle nombre).

**Frontend: CERO cambios.** `CompanyDialog`/`CompanyTable` ya trataban `company.logoUrl` como un
string opaco para pasarle a `<img src>` — un `data:` URI funciona ahí exactamente igual que una
URL `http://`. El PDF del Kardex (`kardex-pdf.ts`, `loadCompanyLogo()`) tampoco necesitó cambios:
ya hacía `fetch(url)` sobre lo que sea que llegue, y `fetch()` soporta `data:` URIs nativamente —
de hecho, un `data:` URI ni siquiera tiene el problema de CORS que la función ya resolvía para el
caso `http://` (no hay origen cruzado posible). Se actualizaron únicamente los comentarios que
asumían "URL absoluta"/"archivo borrado" para no dejar una explicación desactualizada.

## Verificado

`tsc --noEmit`/`eslint`/`build` en los dos proyectos (limpios) — sin prueba en vivo, a pedido del
usuario (ver memoria del proyecto: no levantar backend/frontend para verificar). Falta correr
esta migración contra producción (Render) y subir un logo de nuevo — el anterior no sobrevivió al
deploy, según lo explicado arriba.
