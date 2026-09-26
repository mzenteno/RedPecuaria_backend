import { MigrationInterface, QueryRunner } from 'typeorm';

const COMPANY_NAME = 'Empresa';
const ADMIN_EMAIL = 'mzenteno.intedes@gmail.com';
// Hash bcrypt ya calculado de la contraseña real (nunca se guarda el texto
// plano en el repo/historial de git) — se inserta tal cual, sin volver a
// pasarlo por bcrypt.hash(), o quedaría hasheado dos veces y el login
// fallaría.
const ADMIN_PASSWORD_HASH =
  '$2b$10$8TDIZpN7pYMXd1tOS9V6rOCjuxn5R3huAViG6yunyokyff6WmS/wW';
const ADMIN_FULL_NAME = 'administrador';

/**
 * Datos semilla para poder operar el sistema desde cero: una empresa de
 * ejemplo, el catálogo de menús ya construido (agrupados bajo
 * "Administración"), y un usuario administrador — sin rol ni empresa
 * asignados (ver más abajo).
 *
 * A pedido del usuario (2026-09-25): este usuario termina siendo
 * "Super Administrador" (lo reclasifica una migración posterior,
 * `AddSuperAdminUserType`, que corre después de que exista la columna
 * `user_type_id`) — y un Super Administrador **no pertenece a ninguna
 * empresa puntual**: no se le crea ninguna fila en `user_companies`, ni
 * hace falta ningún `Role` para él (ve todas las empresas y tiene acceso
 * total a todos los menús por su `UserType`, no por membresía — ver
 * `docs/user-company/changes/2026-09-25-super-admin-sin-user-company.md`).
 * Antes esta migración sembraba también un rol "Administrador"/"Super
 * Administrador" con permisos completos y una fila en `user_companies`
 * para este mismo usuario — ya no hace falta: si una empresa necesita sus
 * propios roles, se crean a mano desde el CRUD de roles (pantalla
 * dedicada), no hay auto-creación de un rol por defecto.
 */
export class SeedInitialData1787536340018 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`INSERT INTO "companies" ("name") VALUES ($1)`, [
      COMPANY_NAME,
    ]);

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
      await queryRunner.query(
        `INSERT INTO "menus" ("key", "label", "parent_id", "order")
         VALUES ($1, $2, $3, $4)`,
        [menu.key, menu.label, parentMenuId, menu.order],
      );
    }

    await queryRunner.query(
      `INSERT INTO "users" ("email", "password_hash", "full_name")
       VALUES ($1, $2, $3)`,
      [ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_FULL_NAME],
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "users" WHERE "email" = $1`, [
      ADMIN_EMAIL,
    ]);
    await queryRunner.query(
      `DELETE FROM "menus" WHERE "key" IN ('administration', 'companies', 'users', 'roles', 'permissions')`,
    );
    await queryRunner.query(`DELETE FROM "companies" WHERE "name" = $1`, [
      COMPANY_NAME,
    ]);
  }
}
