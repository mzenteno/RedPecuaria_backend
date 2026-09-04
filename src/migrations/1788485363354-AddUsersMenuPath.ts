import { MigrationInterface, QueryRunner } from 'typeorm';

const MENU_KEY = 'users';
const MENU_PATH = '/users';

/**
 * Asigna la ruta real del frontend al menú "Usuarios" ahora que la pantalla
 * existe (ver docs/user/user.md) — hasta ahora tenía `path: null` y el
 * sidebar lo mostraba como texto no clickeable (mismo caso que
 * AddCompaniesMenuPath para "Empresas").
 */
export class AddUsersMenuPath1788485363354 implements MigrationInterface {
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
