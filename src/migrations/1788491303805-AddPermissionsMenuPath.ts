import { MigrationInterface, QueryRunner } from 'typeorm';

const MENU_KEY = 'permissions';
const MENU_PATH = '/permissions';

/**
 * Asigna la ruta real del frontend al menú "Permisos" ahora que la pantalla
 * existe (ver docs/permission/permission.md) — mismo caso que
 * AddCompaniesMenuPath/AddUsersMenuPath/AddRolesMenuPath.
 */
export class AddPermissionsMenuPath1788491303805 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`UPDATE "menus" SET "path" = $1 WHERE "key" = $2`, [
      MENU_PATH,
      MENU_KEY,
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "menus" SET "path" = NULL WHERE "key" = $1`,
      [MENU_KEY],
    );
  }
}
