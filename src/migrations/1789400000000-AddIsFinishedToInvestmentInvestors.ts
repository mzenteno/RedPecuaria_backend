import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * "Terminada" pasa a ser por inversionista (a pedido del usuario,
 * 2026-10-19): como el Kardex ya se lleva por inversionista (ver
 * `AddBalanceToInvestmentInvestors`), cada uno cierra su parte por separado.
 * `investments.is_finished` NO se borra: queda como valor derivado
 * (terminada = todos sus inversionistas terminados), recalculado en cada
 * cambio — ver `syncInvestmentFinished`.
 *
 * Cada inversionista arranca con el estado que tenía su inversión hasta
 * ahora, así el derivado coincide con el valor actual desde el primer día.
 */
export class AddIsFinishedToInvestmentInvestors1789400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investment_investors"
        ADD COLUMN "is_finished" boolean NOT NULL DEFAULT false
    `);
    await queryRunner.query(`
      UPDATE "investment_investors" ii
        SET "is_finished" = i."is_finished"
        FROM "investments" i
        WHERE i."id" = ii."investment_id"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investment_investors" DROP COLUMN "is_finished"
    `);
  }
}
