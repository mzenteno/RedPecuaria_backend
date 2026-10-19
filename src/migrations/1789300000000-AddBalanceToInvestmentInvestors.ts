import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * El Kardex pasa a ser por inversionista (a pedido del usuario, 2026-10-14):
 * cada movimiento (ingreso/baja/venta) queda atado a un inversionista
 * puntual, y el saldo vigente se lleva por inversionista, no solo a nivel
 * de la inversión completa (ver `Investment.balanceQuantity`/`balanceKilos`/
 * `total`, que se mantiene como agregado sin cambios). Mismos tipos de
 * columna que esos 3 campos en `investments`.
 */
export class AddBalanceToInvestmentInvestors1789300000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investment_investors"
        ADD COLUMN "balance_quantity" integer NOT NULL DEFAULT 0,
        ADD COLUMN "balance_kilos" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN "total" numeric(14,2) NOT NULL DEFAULT 0
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investment_investors"
        DROP COLUMN "balance_quantity",
        DROP COLUMN "balance_kilos",
        DROP COLUMN "total"
    `);
  }
}
