import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A pedido del usuario: `kardex_entries.movement_type` era un `varchar(20)`
 * con el texto literal ("ingreso"/"venta"/"baja") directo en la fila, a
 * pesar de que el comentario del código decía "mismo criterio que
 * `UserType`" — que en realidad SÍ es una tabla propia con FK
 * (`user_types`). Esta migración corrige esa inconsistencia: crea
 * `kardex_movement_types` (catálogo cerrado, igual forma que `user_types`)
 * y reemplaza la columna de texto por `movement_type_id` (FK).
 *
 * Con backfill de datos (a diferencia de `MoveKardexBalanceToInvestment`):
 * acá sí hay datos existentes con significado real que no se pueden perder
 * — qué tipo era cada fila de kardex ya cargada.
 */
export class AddKardexMovementTypesTable1788700000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "kardex_movement_types" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "name" varchar(100) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kardex_movement_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_kardex_movement_types_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "kardex_movement_types" ("name") VALUES ('ingreso'), ('venta'), ('baja')
    `);

    await queryRunner.query(`
      ALTER TABLE "kardex_entries" ADD COLUMN "movement_type_id" bigint
    `);
    await queryRunner.query(`
      UPDATE "kardex_entries" ke
        SET "movement_type_id" = mt.id
        FROM "kardex_movement_types" mt
        WHERE mt.name = ke.movement_type
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" ALTER COLUMN "movement_type_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD CONSTRAINT "FK_kardex_entries_movement_type"
        FOREIGN KEY ("movement_type_id") REFERENCES "kardex_movement_types" ("id")
        ON DELETE RESTRICT
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" DROP COLUMN "movement_type"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" ADD COLUMN "movement_type" varchar(20)
    `);
    await queryRunner.query(`
      UPDATE "kardex_entries" ke
        SET "movement_type" = mt.name
        FROM "kardex_movement_types" mt
        WHERE mt.id = ke.movement_type_id
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" ALTER COLUMN "movement_type" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" DROP CONSTRAINT "FK_kardex_entries_movement_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" DROP COLUMN "movement_type_id"
    `);
    await queryRunner.query(`
      DROP TABLE "kardex_movement_types"
    `);
  }
}
