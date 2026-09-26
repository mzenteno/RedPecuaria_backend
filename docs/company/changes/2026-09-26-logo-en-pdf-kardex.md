# El logo de la empresa aparece en el encabezado del PDF de Kardex

**Estado:** ✅ implementado, 2026-09-26. Cierra el pendiente dejado en
[2026-09-26-logo-de-empresa.md](./2026-09-26-logo-de-empresa.md) ("la parte de estamparlo en el
PDF del Kardex queda para un pedido posterior").

## Qué pedía el usuario

Mostrar el logo arriba del bloque "Descripción/Gestión/Inversionistas" del PDF que genera
`frontend/src/lib/kardex-pdf.ts` (`downloadKardexPdf`, disparado desde `app/(main)/kardex`).

## De dónde sale el logo

El logo es el de la **empresa activa de la sesión** (`companyId` del token, no una empresa
elegida a mano) — nuevo hook `useActiveCompanyId()` (`frontend/src/hooks/menu/`, mismo patrón
lazy-initializer que `useIsSuperAdmin`/`useIsInvestor`: decodifica el JWT sin red). Se cruza
contra `useCompanies()` (ya existente) para sacar el `logoUrl` real — el token solo lleva el id,
no el logo en sí, para no quedar desactualizado si el logo cambia sin volver a loguearse.
`useCompanies()` ya devuelve solo la empresa propia si quien mira no es Super Administrador, así
que este cruce nunca expone el logo de una empresa ajena.

## El problema técnico: `jsPDF.addImage()` no acepta una URL

El logo vive en el backend, servido por URL (`Company.logoUrl`, ver el change anterior) —
`doc.addImage()` de `jsPDF` necesita los bytes de la imagen ya en memoria (un data URL o
similar), no puede pedirle a una URL remota que se cargue sola. Y de los 4 formatos que se
pueden subir como logo (PNG/JPG/WEBP/SVG), `jsPDF` **no** acepta SVG directamente.

Se resolvió con una única función, `loadCompanyLogo(url)`, que:
1. Descarga el logo con `fetch()` (por eso `downloadKardexPdf` pasó a ser **async** — antes no
   lo era).
2. Redibuja la imagen ya descargada en un `<canvas>` y la vuelve a sacar como PNG
   (`canvas.toDataURL('image/png')`) — esto resuelve el problema del SVG, y de paso evita
   bifurcar el código según el mimetype del logo (los 4 formatos pasan por el mismo camino).
3. Devuelve también el ancho/alto naturales, para escalar el logo manteniendo su proporción en
   vez de estirarlo a un cuadrado fijo.

**El detalle de CORS que hay que entender para no "arreglarlo" mal después**: el `Blob` ya
descargado se convierte a un `blob:` URL (`URL.createObjectURL`) — el `<img>` que se dibuja en el
canvas usa ESE `blob:` URL, nunca la URL `http://` original del backend. Si se usara la URL
original directo, el canvas quedaría "tainted" por CORS y `toDataURL()` tiraría una excepción de
seguridad. Con el `blob:` URL no hay ese problema, porque en ese punto la imagen ya son bytes
propios del navegador, no un recurso remoto.

Cualquier falla en el camino (red, CORS, el archivo se borró) hace que `loadCompanyLogo` devuelva
`null` — el PDF se sigue generando igual, solo sin el logo. Un logo roto no debe impedir bajar el
Kardex.

## Dónde queda en la página

Entre el subtítulo `PROPIEDAD "..."` y el bloque `Descripción:/Gestión:/Inversionistas:` (a
pedido explícito del usuario) — escalado para entrar en una caja de 120×40 pt manteniendo
proporción, alineado a la izquierda igual que ese bloque de texto. Si la empresa no tiene logo
cargado, el encabezado queda exactamente como antes (sin hueco ni espacio de más).

## Verificado

`tsc --noEmit`/`eslint`/`build` en el frontend (limpios) — sin prueba en vivo, a pedido del
usuario (ver memoria del proyecto: no levantar backend/frontend para verificar). La descarga del
logo por `fetch()` en un navegador real, con el backend realmente corriendo, queda sin probar en
este pase.
