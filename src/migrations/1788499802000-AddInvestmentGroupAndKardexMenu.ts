import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Dos cambios de navegación/permisos a pedido del usuario, tras terminar
 * Propiedades/Inversiones/Kardex (ver docs/property, docs/investment):
 *
 * 1. Agrupar "Propiedades" e "Inversiones" bajo un padre propio "Inversiones"
 *    (hoy colgaban de "Administración", que es la sección de plataforma, no
 *    de negocio ganadero) — mismo patrón que "Administración" agrupando
 *    Empresas/Usuarios/Roles/Permisos.
 * 2. Separar el permiso del Kardex del de Inversión: hoy ambas pantallas
 *    comparten `menuKey = 'investments'`, lo que impide dar "puede crear
 *    inversiones pero no tocar el kardex" (o viceversa) a un rol. Se agrega
 *    un menú `kardex` propio, con sus 4 flags independientes.
 *
 * El Kardex es un drill-down de una inversión puntual (`/investments/:id/kardex`),
 * no una pantalla de navegación directa — no debe aparecer como ítem del
 * sidebar. Para eso se agrega la columna `show_in_sidebar` (default `true`,
 * así que ningún menú existente cambia de comportamiento): el árbol del
 * frontend (`get-menu.use-case.impl.ts`) lo filtra antes de armar el árbol,
 * y sigue existiendo como fila normal en la matriz de Permisos (`path` no es
 * `null`) y como `menuKey` válido para `usePermission`/`RequirePermission`.
 *
 * Nota de diseño: no alcanzaba con colgar `kardex` de `investments` en el
 * árbol sin este flag — `sidebar.tsx` convierte cualquier menú con hijos en
 * un botón colapsable en vez de un link, así que "Inversiones" hubiera
 * dejado de navegar directo a su propio CRUD.
 *
 * Los permisos de `kardex` se copian de los que cada rol ya tiene hoy en
 * `investments`, para que nadie pierda ni gane acceso hasta que se ajuste a
 * mano desde la pantalla de Permisos.
 */
export class AddInvestmentGroupAndKardexMenu1788499802000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menus" ADD COLUMN "show_in_sidebar" boolean NOT NULL DEFAULT true`,
    );

    const [investmentGroupMenu] = await queryRunner.query(
      `INSERT INTO "menus" ("key", "label", "path", "parent_id", "order")
       VALUES ('investment-management', 'Inversiones', NULL, NULL, 2)
       RETURNING "id"`,
    );

    await queryRunner.query(
      `UPDATE "menus" SET "parent_id" = $1 WHERE "key" IN ('properties', 'investments')`,
      [investmentGroupMenu.id],
    );

    const [investmentsMenu] = await queryRunner.query(
      `SELECT "id" FROM "menus" WHERE "key" = 'investments'`,
    );
    const [kardexMenu] = await queryRunner.query(
      `INSERT INTO "menus" ("key", "label", "path", "parent_id", "order", "show_in_sidebar")
       VALUES ('kardex', 'Kardex', '/investments/:id/kardex', $1, 1, false)
       RETURNING "id"`,
      [investmentsMenu.id],
    );

    await queryRunner.query(
      `INSERT INTO "role_menu_permissions"
         ("role_id", "menu_id", "can_view", "can_create", "can_edit", "can_delete")
       SELECT "role_id", $1, "can_view", "can_create", "can_edit", "can_delete"
       FROM "role_menu_permissions"
       WHERE "menu_id" = $2`,
      [kardexMenu.id, investmentsMenu.id],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [adminMenu] = await queryRunner.query(
      `SELECT "id" FROM "menus" WHERE "key" = 'administration'`,
    );

    await queryRunner.query(
      `DELETE FROM "role_menu_permissions" WHERE "menu_id" = (
         SELECT "id" FROM "menus" WHERE "key" = 'kardex'
       )`,
    );
    await queryRunner.query(`DELETE FROM "menus" WHERE "key" = 'kardex'`);

    await queryRunner.query(
      `UPDATE "menus" SET "parent_id" = $1 WHERE "key" IN ('properties', 'investments')`,
      [adminMenu.id],
    );
    await queryRunner.query(
      `DELETE FROM "menus" WHERE "key" = 'investment-management'`,
    );

    await queryRunner.query(
      `ALTER TABLE "menus" DROP COLUMN "show_in_sidebar"`,
    );
  }
}
