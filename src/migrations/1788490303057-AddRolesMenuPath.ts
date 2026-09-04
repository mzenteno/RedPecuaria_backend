import { MigrationInterface, QueryRunner } from 'typeorm';

const MENU_KEY = 'roles';
const MENU_PATH = '/roles';

/**
 * Asigna la ruta real del frontend al menú "Roles" ahora que la pantalla
 * existe (ver docs/role/role.md) — mismo caso que AddCompaniesMenuPath y
 * AddUsersMenuPath.
 */
export class AddRolesMenuPath1788490303057 implements MigrationInterface {
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
