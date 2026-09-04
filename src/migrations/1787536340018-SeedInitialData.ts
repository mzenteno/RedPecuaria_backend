import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

const COMPANY_NAME = 'Empresa';
const ROLE_NAME = 'Administrador';
const ADMIN_EMAIL = 'mzenteno.intedes@gmail.com';
const ADMIN_PASSWORD = 'Firmadigital1982';
const ADMIN_FULL_NAME = 'administrador';

/**
 * Datos semilla para poder operar el sistema desde cero: una empresa, un rol
 * con permisos completos, el catálogo de menús ya construido (agrupados bajo
 * "Administración"), y un usuario administrador vinculado a esa empresa y rol.
 * Ver la carpeta "changes" de cada módulo en docs/ para el detalle.
 */
export class SeedInitialData1787536340018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const [company] = await queryRunner.query(
      `INSERT INTO "companies" ("name") VALUES ($1) RETURNING "id"`,
      [COMPANY_NAME],
    );
    const companyId = company.id;

    const [role] = await queryRunner.query(
      `INSERT INTO "roles" ("company_id", "name") VALUES ($1, $2) RETURNING "id"`,
      [companyId, ROLE_NAME],
    );
    const roleId = role.id;

    const [parentMenu] = await queryRunner.query(
      `INSERT INTO "menus" ("key", "label", "order") VALUES ($1, $2, $3) RETURNING "id"`,
      ['administration', 'Administración', 1],
    );
    const parentMenuId = parentMenu.id;

    const childMenus: Array<{ key: string; label: string; order: number }> = [
      { key: 'companies', label: 'Empresas', order: 1 },
      { key: 'users', label: 'Usuarios', order: 2 },
      { key: 'roles', label: 'Roles', order: 3 },
      { key: 'permissions', label: 'Permisos', order: 4 },
    ];

    for (const menu of childMenus) {
      const [childMenu] = await queryRunner.query(
        `INSERT INTO "menus" ("key", "label", "parent_id", "order")
         VALUES ($1, $2, $3, $4) RETURNING "id"`,
        [menu.key, menu.label, parentMenuId, menu.order],
      );

      await queryRunner.query(
        `INSERT INTO "role_menu_permissions"
           ("role_id", "menu_id", "can_view", "can_create", "can_edit", "can_delete")
         VALUES ($1, $2, true, true, true, true)`,
        [roleId, childMenu.id],
      );
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, SALT_ROUNDS);
    const [user] = await queryRunner.query(
      `INSERT INTO "users" ("email", "password_hash", "full_name")
       VALUES ($1, $2, $3) RETURNING "id"`,
      [ADMIN_EMAIL, passwordHash, ADMIN_FULL_NAME],
    );
    const userId = user.id;

    await queryRunner.query(
      `INSERT INTO "user_companies" ("user_id", "company_id", "role_id")
       VALUES ($1, $2, $3)`,
      [userId, companyId, roleId],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "user_companies" WHERE "user_id" IN (
         SELECT "id" FROM "users" WHERE "email" = $1
       )`,
      [ADMIN_EMAIL],
    );
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      ADMIN_EMAIL,
    ]);
    await queryRunner.query(
      `DELETE FROM "role_menu_permissions" WHERE "role_id" IN (
         SELECT "id" FROM "roles" WHERE "name" = $1
       )`,
      [ROLE_NAME],
    );
    await queryRunner.query(
      `DELETE FROM "menus" WHERE "key" IN ('administration', 'companies', 'users', 'roles', 'permissions')`,
    );
    await queryRunner.query(`DELETE FROM "roles" WHERE "name" = $1`, [
      ROLE_NAME,
    ]);
    await queryRunner.query(`DELETE FROM "companies" WHERE "name" = $1`, [
      COMPANY_NAME,
    ]);
  }
}
