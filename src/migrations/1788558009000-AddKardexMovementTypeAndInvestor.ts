import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A pedido del usuario, basado en la planilla de referencia real: el kardex
 * no es un solo tipo de movimiento homogéneo — "Ingreso" (carga general de
 * ganado a la inversión) y "Baja" (pérdida/muerte) son generales, sin
 * inversionista particular; "Venta" sí se atribuye a un inversionista
 * puntual (a quién se le reparte esa venta). Antes no existía ningún
 * concepto de tipo de movimiento ni de inversionista por fila de kardex —
 * decisión explícita de la Fase 1 (ver docs/investment/investment.md,
 * "Decisiones de alcance", punto 5: "por el momento registralo sin
 * inversionista"), revisada ahora para el caso puntual de "Venta".
 *
 * `movement_type` default `'ingreso'` para no romper filas existentes (si
 * las hay) — es el tipo más neutro/general de los tres.
 */
export class AddKardexMovementTypeAndInvestor1788558009000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD COLUMN "movement_type" varchar(20) NOT NULL DEFAULT 'ingreso'
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD COLUMN "investor_user_id" bigint NULL
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD CONSTRAINT "FK_kardex_entries_investor_user"
        FOREIGN KEY ("investor_user_id") REFERENCES "users" ("id")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        DROP CONSTRAINT "FK_kardex_entries_investor_user"
    `);
    await queryRunner.query(
      `ALTER TABLE "kardex_entries" DROP COLUMN "investor_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "kardex_entries" DROP COLUMN "movement_type"`,
    );
  }
}
