import { MigrationInterface, QueryRunner } from 'typeorm';

const SUPER_ADMIN_TYPE_NAME = 'Super Administrador';
const ADMIN_TYPE_NAME = 'Administrador';
const SEEDED_ADMIN_USERNAME = 'admin';

/**
 * Agrega el tercer tipo de usuario "Super Administrador" (ver
 * docs/user-type/user-type.md). A diferencia de Administrador/Inversionista
 * — que solo ven la empresa de su sesión actual — un Super Administrador ve
 * todas las empresas (`ListCompaniesUseCase`). El único usuario con acceso a
 * más de una empresa hasta ahora (el admin sembrado, `username: "admin"`) se
 * reclasifica a Super Administrador, porque es justo el caso que esta regla
 * describe.
 */
export class AddSuperAdminUserType1788404893551 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [superAdminType] = await queryRunner.query(
      `INSERT INTO "user_types" ("name") VALUES ($1) RETURNING "id"`,
      [SUPER_ADMIN_TYPE_NAME],
    );

    await queryRunner.query(
      `UPDATE "users" SET "user_type_id" = $1 WHERE "user_name" = $2`,
      [superAdminType.id, SEEDED_ADMIN_USERNAME],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const [adminType] = await queryRunner.query(
      `SELECT "id" FROM "user_types" WHERE "name" = $1`,
      [ADMIN_TYPE_NAME],
    );

    await queryRunner.query(
      `UPDATE "users" SET "user_type_id" = $1 WHERE "user_name" = $2`,
      [adminType.id, SEEDED_ADMIN_USERNAME],
    );

    await queryRunner.query(`DELETE FROM "user_types" WHERE "name" = $1`, [
      SUPER_ADMIN_TYPE_NAME,
    ]);
  }
}
