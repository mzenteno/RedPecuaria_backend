import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * A pedido del usuario: estado de negocio de la inversión (activa/
 * terminada), elegido a mano desde el diálogo de edición — la idea de uso
 * es marcarla como terminada cuando el saldo (`balanceQuantity`) llegue a
 * 0, pero no se calcula ni se fuerza automáticamente (ver
 * `Investment.update`, docs/investment/investment.md).
 *
 * Distinto de `is_deleted` (baja administrativa, oculta el registro):
 * `is_finished` es solo informativo, la inversión sigue visible y
 * operable igual.
 */
export class AddIsFinishedToInvestments1788800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investments"
        ADD COLUMN "is_finished" boolean NOT NULL DEFAULT false
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "investments" DROP COLUMN "is_finished"
    `);
  }
}
