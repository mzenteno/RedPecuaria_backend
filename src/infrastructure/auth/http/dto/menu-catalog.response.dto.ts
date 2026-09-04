/** Catálogo plano de menús, sin permisos de nadie — a diferencia de
 * `MenuResponseDto` (`GET /me/menu`), que además anota los `can*` del rol de
 * quien pregunta. Lo usa la pantalla de Permisos para saber qué menús
 * existen, independientemente de a quién se le estén asignando permisos. */
export class MenuCatalogResponseDto {
  id: string;
  key: string;
  label: string;
  icon: string | null;
  path: string | null;
  parentId: string | null;
  order: number;
  showInSidebar: boolean;
}
