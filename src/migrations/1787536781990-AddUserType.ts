import { MigrationInterface, QueryRunner } from 'typeorm';

const ADMIN_TYPE_NAME = 'Administrador';
const INVESTOR_TYPE_NAME = 'Inversionista';

/**
 * Agrega la tabla "user_types" (clasificación puramente informativa de un
 * usuario: Administrador / Inversionista, sin relación con los permisos por
 * menú, que siguen siendo responsabilidad de Role/RoleMenuPermission) y la
 * columna "user_type_id" en "users". Ver docs/user-type y docs/user.
 */
export class AddUserType1787536781990 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_types" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "name" varchar(100) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_types" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_types_name" UNIQUE ("name")
      )
    `);

    const [adminType] = await queryRunner.query(
      `INSERT INTO "user_types" ("name") VALUES ($1) RETURNING "id"`,
      [ADMIN_TYPE_NAME],
    );
    await queryRunner.query(`INSERT INTO "user_types" ("name") VALUES ($1)`, [
      INVESTOR_TYPE_NAME,
    ]);

    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "user_type_id" bigint`,
    );

    // Backfill: los usuarios ya sembrados (el admin de Fase 2) quedan como "Administrador".
    await queryRunner.query(`UPDATE "users" SET "user_type_id" = $1`, [
      adminType.id,
    ]);

    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "user_type_id" SET NOT NULL`,
    );
    await queryRunner.query(`
      ALTER TABLE "users" ADD CONSTRAINT "FK_users_user_type"
        FOREIGN KEY ("user_type_id") REFERENCES "user_types" ("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP CONSTRAINT "FK_users_user_type"`,
    );
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "user_type_id"`);
    await queryRunner.query(`DROP TABLE "user_types"`);
  }
}
