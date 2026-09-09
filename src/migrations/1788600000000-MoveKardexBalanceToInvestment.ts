import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A pedido del usuario: `balance_quantity`/`balance_kilos`/`total` dejan de
 * ser una foto por fila de `kardex_entries` (el saldo después de cada
 * movimiento) y pasan a ser el saldo VIGENTE de la inversión, mantenido en
 * `investments` — `kardex_entries` queda como log puro de movimientos (ver
 * `Investment.applyBalanceDelta` y `computeMovementDelta`).
 *
 * `kardex_entries.total` NO se toca: sigue siendo el monto que tipea el
 * usuario en Ingreso/Venta, ahora además acumulado en
 * `investments.total`.
 *
 * Sin migración de datos (a pedido del usuario, todavía en fase de
 * desarrollo) — `investments.balance_quantity`/`balance_kilos`/`total`
 * arrancan en 0 para las inversiones ya existentes.
 */
export class MoveKardexBalanceToInvestment1788600000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investments"
        ADD COLUMN "balance_quantity" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "investments"
        ADD COLUMN "balance_kilos" numeric(12,2) NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "investments"
        ADD COLUMN "total" numeric(14,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "kardex_entries" DROP COLUMN "balance_quantity"
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries" DROP COLUMN "balance_kilos"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD COLUMN "balance_quantity" integer NOT NULL DEFAULT 0
    `);
    await queryRunner.query(`
      ALTER TABLE "kardex_entries"
        ADD COLUMN "balance_kilos" numeric(12,2) NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "investments" DROP COLUMN "total"
    `);
    await queryRunner.query(`
      ALTER TABLE "investments" DROP COLUMN "balance_kilos"
    `);
    await queryRunner.query(`
      ALTER TABLE "investments" DROP COLUMN "balance_quantity"
    `);
  }
}
