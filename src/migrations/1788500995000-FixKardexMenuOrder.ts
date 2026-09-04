import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Corrige el `order` de `kardex` (migración `AddInvestmentGroupAndKardexMenu`):
 * se le puso `1` pensando en "orden entre hermanos" (único hijo de
 * `investments`), pero la pantalla de Permisos (`use-role-permissions.ts`)
 * usa este mismo campo como orden **global** de toda la tabla, sin agrupar
 * por padre — `1` choca con `companies` (también `order: 1`), así que
 * "Kardex" aparecía salteado cerca de "Empresas" en vez de al lado de
 * "Inversiones". Se cambia a `7` (siguiente a `investments`, que es `6`) para
 * que quede ordenado justo después en esa grilla.
 */
export class FixKardexMenuOrder1788500995000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "menus" SET "order" = 7 WHERE "key" = 'kardex'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `UPDATE "menus" SET "order" = 1 WHERE "key" = 'kardex'`,
    );
  }
}
