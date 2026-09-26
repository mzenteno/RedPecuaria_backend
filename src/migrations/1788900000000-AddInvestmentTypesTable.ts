import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A pedido del usuario: una inversión puede ser "por kilo" (hoy, el único
 * modo que existía) o "por dinero" — en ese segundo modo, `total` hace el
 * papel de `balanceKilos` (saldo físico que Ingreso suma y Venta resta, sin
 * poder quedar negativo), en vez de trackear kilos.
 *
 * Catálogo cerrado (`investment_types`, igual forma que `kardex_movement_
 * types`) en vez de un `varchar` con el texto repetido en cada fila — ese
 * error ya se cometió una vez con `movement_type` y se corrigió en
 * `AddKardexMovementTypesTable` (ver ese archivo); no tiene sentido
 * repetirlo acá. Sin backfill de datos con significado real que perder
 * (a diferencia de esa migración): todas las inversiones existentes son
 * "por kilo" porque es el único modo que existió hasta ahora.
 */
export class AddInvestmentTypesTable1788900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "investment_types" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "name" varchar(100) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_investment_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_investment_types_name" UNIQUE ("name")
      )
    `);
    await queryRunner.query(`
      INSERT INTO "investment_types" ("name") VALUES ('kilo'), ('dinero')
    `);

    await queryRunner.query(`
      ALTER TABLE "investments" ADD COLUMN "investment_type_id" bigint
    `);
    await queryRunner.query(`
      UPDATE "investments"
        SET "investment_type_id" = (SELECT id FROM "investment_types" WHERE name = 'kilo')
    `);
    await queryRunner.query(`
      ALTER TABLE "investments" ALTER COLUMN "investment_type_id" SET NOT NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "investments"
        ADD CONSTRAINT "FK_investments_investment_type"
        FOREIGN KEY ("investment_type_id") REFERENCES "investment_types" ("id")
        ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investments" DROP CONSTRAINT "FK_investments_investment_type"
    `);
    await queryRunner.query(`
      ALTER TABLE "investments" DROP COLUMN "investment_type_id"
    `);
    await queryRunner.query(`
      DROP TABLE "investment_types"
    `);
  }
}
