import { MigrationInterface, QueryRunner } from 'typeorm';

const SEEDED_ADMIN_USERNAME = 'admin';

/**
 * Agrega `user_name` a `users` como el identificador de login, y el email
 * deja de ser único (una misma persona puede repetir email — ver
 * docs/user/user.md y docs/auth-sessions/auth-sessions.md).
 */
export class AddUsernameToUsers1788316775263 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD COLUMN "user_name" varchar(255)
    `);

    // Backfill: el único usuario sembrado hasta ahora es el administrador.
    await queryRunner.query(
      `UPDATE "users" SET "user_name" = $1 WHERE "user_name" IS NULL`,
      [SEEDED_ADMIN_USERNAME],
    );

    await queryRunner.query(`
      ALTER TABLE "users" ALTER COLUMN "user_name" SET NOT NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_username" UNIQUE ("user_name")
    `);

    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_email"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "UQ_users_email" UNIQUE ("email")
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP CONSTRAINT "UQ_users_username"
    `);
    await queryRunner.query(`
      ALTER TABLE "users" DROP COLUMN "user_name"
    `);
  }
}
