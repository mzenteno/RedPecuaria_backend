# 2026-09-04 — "Gestión" reemplaza a "Propiedad" como filtro que carga la lista

**Rama:** master
**Commit(s):** _pendiente — se completa al commitear este cambio_

## Qué cambió

- Nuevo `GET /investments/by-gestion?gestion=` (`ListInvestmentsByGestionUseCase` +
  `InvestmentRepository.findActiveByCompanyAndGestion`): inversiones activas de una gestión
  puntual, de **cualquier propiedad** de la empresa activa — sin filtro de propiedad.
- `app/(main)/investments` (frontend): "Gestión" pasa a ser el primer filtro y el que dispara la
  consulta (combo con placeholder normal, sin una opción "Todas" — hay que elegir una para ver
  algo). "Propiedad" pasa a ser un filtro opcional del lado del cliente sobre esa misma lista —
  también sin una opción "Todas": dejarlo sin elegir ya significa "sin filtro de propiedad"
  (regla general del proyecto, ningún combo ofrece una opción "Todos"/"Todas", ver
  `frontend/ARCHITECTURE.md` §10). Roles invertidos respecto al diseño anterior.
- `InvestmentTable` agrega la columna "Propiedad" — con "Gestión" como filtro principal, la
  tabla puede mostrar inversiones de varias propiedades a la vez, hace falta saber de cuál es
  cada fila.
- "Nueva inversión" solo se ofrece con una Propiedad puntual elegida — crear una inversión
  necesita saber a qué propiedad va.

## Motivo

A pedido del usuario, en dos vueltas: primero pidió agregar "Gestión" como filtro adicional
antes que "Propiedad"; después aclaró que en realidad quería invertir los roles del todo —
"Gestión" sin una opción "Todas" (hay que elegir una), y que elegirla sea lo que carga la
tabla; "Propiedad" queda como algo que "también" se puede usar para filtrar, no como el
disparador.

## Qué había antes

Solo "Propiedad" como filtro y disparador de la consulta al backend (`GET
/investments?propertyId=`, que se mantiene sin cambios — lo sigue usando el atajo "Ver kardex"
de la tabla de Inversiones, ver `docs/menu/menu.md`).

## Continuación — un tercer filtro: "Inversionista"

Se agregó "Inversionista" como filtro adicional, para buscar todas las inversiones de un
inversionista puntual sin importar la gestión ni la propiedad. Nuevo `GET
/investments/by-investor?investorUserId=` — reusa el mismo `ListInvestmentsByInvestorUseCase`
que ya existía para `GET /investments/mine` (Kardex), pero acá `investorUserId` es **explícito**
(elegido en un combo por un administrador buscando a cualquier inversionista de su empresa, no
"los míos").

"Gestión" e "Inversionista" son dos formas independientes de traer la lista base — cualquiera de
las dos alcanza, no hace falta elegir ambas. Con "Gestión" elegida, ese sigue siendo el modo
activo aunque también haya un inversionista elegido: ahí "Inversionista" se aplica como filtro
extra del lado del cliente sobre la lista ya traída (sirve para "inversiones de tal
inversionista en tal gestión"). "Propiedad" sigue siendo un filtro opcional del lado del
cliente, sobre cualquiera de las dos listas.
