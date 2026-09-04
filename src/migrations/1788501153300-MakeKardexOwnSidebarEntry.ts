import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrección de diseño a pedido del usuario: Kardex pasa de ser un permiso
 * "invisible" (`show_in_sidebar: false`, colgado de `investments` solo para
 * tener sus propios flags) a ser una pantalla real del sidebar, hermana de
 * "Propiedades" e "Inversiones" bajo el grupo "Inversiones"
 * (`investment-management`). Motivo: un usuario que solo puede hacer kardex
 * (no crear/editar inversiones) necesita una forma de **llegar** a la
 * pantalla sin pasar por el CRUD de Inversiones, que puede no tener permiso
 * para ver.
 *
 * `path` cambia de `/investments/:id/kardex` (ruta dinámica, dependía de una
 * inversión puntual) a `/kardex` (ruta fija): la pantalla ahora elige
 * Propiedad → Inversión con dos combobox propios (igual patrón que
 * "Inversiones" elige Propiedad), en vez de depender de un `:id` en la URL.
 * El botón "Ver kardex" de la tabla de Inversiones sigue existiendo, como
 * atajo — ahora navega a `/kardex?propertyId=&investmentId=` para
 * preseleccionar los combobox.
 */
export class MakeKardexOwnSidebarEntry1788501153300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [investmentGroupMenu] = await queryRunner.query(
      `SELECT "id" FROM "menus" WHERE "key" = 'investment-management'`,
    );
    await queryRunner.query(
      `UPDATE "menus"
       SET "path" = '/kardex', "parent_id" = $1, "show_in_sidebar" = true
       WHERE "key" = 'kardex'`,
      [investmentGroupMenu.id],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [investmentsMenu] = await queryRunner.query(
      `SELECT "id" FROM "menus" WHERE "key" = 'investments'`,
    );
    await queryRunner.query(
      `UPDATE "menus"
       SET "path" = '/investments/:id/kardex', "parent_id" = $1, "show_in_sidebar" = false
       WHERE "key" = 'kardex'`,
      [investmentsMenu.id],
    );
  }
}
