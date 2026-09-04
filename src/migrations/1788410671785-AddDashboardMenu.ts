import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Agrega el menú "Dashboard" (raíz, `order: 0` para que aparezca antes que
 * "Administración") — hasta ahora no había forma de volver al dashboard
 * desde el sidebar una vez que se navegaba a otra pantalla. Se concede
 * `can_view` a todos los roles existentes: es la página de aterrizaje
 * general, no un recurso administrativo — todo rol debería poder verla.
 *
 * Pendiente (ver docs/permission/permission.md): los roles que se creen
 * de acá en más no tienen este permiso automáticamente — hay que
 * concedérselo a mano hasta que exista un mecanismo de "permisos por
 * defecto para menús no administrativos".
 */
export class AddDashboardMenu1788410671785 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [dashboardMenu] = await queryRunner.query(`
      INSERT INTO "menus" ("key", "label", "path", "parent_id", "order")
      VALUES ('dashboard', 'Dashboard', '/dashboard', NULL, 0)
      RETURNING "id"
    `);

    const roles: Array<{ id: string }> = await queryRunner.query(
      `SELECT "id" FROM "roles"`,
    );
    for (const role of roles) {
      await queryRunner.query(
        `INSERT INTO "role_menu_permissions"
           ("role_id", "menu_id", "can_view", "can_create", "can_edit", "can_delete")
         VALUES ($1, $2, true, false, false, false)`,
        [role.id, dashboardMenu.id],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_menu_permissions" WHERE "menu_id" = (SELECT "id" FROM "menus" WHERE "key" = 'dashboard')`,
    );
    await queryRunner.query(`DELETE FROM "menus" WHERE "key" = 'dashboard'`);
  }
}
