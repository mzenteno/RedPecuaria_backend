import { MigrationInterface, QueryRunner } from 'typeorm';

const MENU_KEY = 'companies';
const MENU_PATH = '/companies';

/**
 * Asigna la ruta real del frontend al menú "Empresas" ahora que la pantalla
 * existe (ver docs/company/company.md) — hasta ahora tenía `path: null` y el
 * sidebar lo mostraba como texto no clickeable.
 */
export class AddCompaniesMenuPath1788409628540 implements MigrationInterface {
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
