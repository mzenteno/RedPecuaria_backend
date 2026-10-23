import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Contorno de la propiedad (a pedido del usuario, 2026-10-23): además del
 * punto de ubicación (`latitude`/`longitude`, que sigue existiendo y se
 * marca aparte), un polígono con el perímetro — lista de vértices
 * `{ lat, lng }` en `jsonb`. Opcional: las propiedades existentes quedan en
 * `NULL` hasta que alguien les dibuje el contorno.
 */
export class AddBoundaryToProperties1789500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties" ADD COLUMN "boundary" jsonb NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "properties" DROP COLUMN "boundary"
    `);
  }
}
