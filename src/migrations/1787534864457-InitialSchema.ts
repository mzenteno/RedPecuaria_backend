import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Esquema inicial del módulo auth: companies, users, roles, user_companies,
 * menus, role_menu_permissions, refresh_tokens. Ver docs/ para el detalle de
 * cada concepto y ARCHITECTURE.md para las reglas del proyecto.
 *
 * Los ids son "bigint GENERATED ALWAYS AS IDENTITY": los asigna Postgres al
 * insertar (no se generan en el dominio). Ver la carpeta "changes" de cada
 * módulo en docs/ para el motivo del cambio desde el diseño original con UUID.
 *
 * El campo de baja lógica de cada tabla se llama "is_deleted" (booleano,
 * `false` = registro normal, `true` = dado de baja) — originalmente se llamó
 * "is_active" con la polaridad invertida, corregido acá porque el proyecto
 * todavía no se había desplegado en ningún lado más que este entorno de
 * desarrollo compartido (ver docs/company/changes/ para el detalle del
 * cambio). El vocabulario de negocio sigue siendo "activar/desactivar"
 * (`deactivate()` en el dominio, `PATCH .../deactivate` en la API) — lo que
 * cambió es solo el nombre del campo persistido, no el verbo de la acción.
 */
export class InitialSchema1787534864457 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "companies" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "name" varchar(255) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_companies" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "email" varchar(255) NOT NULL,
        "password_hash" varchar(255) NOT NULL,
        "full_name" varchar(255) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "last_login_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "roles" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "company_id" bigint NOT NULL,
        "name" varchar(255) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roles" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_roles_company_name" UNIQUE ("company_id", "name"),
        CONSTRAINT "UQ_roles_id_company" UNIQUE ("id", "company_id"),
        CONSTRAINT "FK_roles_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "user_companies" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "user_id" bigint NOT NULL,
        "company_id" bigint NOT NULL,
        "role_id" bigint NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_user_companies" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_user_companies_user_company" UNIQUE ("user_id", "company_id"),
        CONSTRAINT "FK_user_companies_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_companies_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_user_companies_role_same_company" FOREIGN KEY ("company_id", "role_id")
          REFERENCES "roles" ("company_id", "id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "menus" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "key" varchar(100) NOT NULL,
        "label" varchar(255) NOT NULL,
        "icon" varchar(100),
        "path" varchar(255),
        "parent_id" bigint,
        "order" integer NOT NULL DEFAULT 0,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_menus" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_menus_key" UNIQUE ("key"),
        CONSTRAINT "FK_menus_parent" FOREIGN KEY ("parent_id")
          REFERENCES "menus" ("id") ON DELETE SET NULL
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "role_menu_permissions" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "role_id" bigint NOT NULL,
        "menu_id" bigint NOT NULL,
        "can_view" boolean NOT NULL DEFAULT false,
        "can_create" boolean NOT NULL DEFAULT false,
        "can_edit" boolean NOT NULL DEFAULT false,
        "can_delete" boolean NOT NULL DEFAULT false,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_role_menu_permissions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_role_menu_permissions_role_menu" UNIQUE ("role_id", "menu_id"),
        CONSTRAINT "FK_role_menu_permissions_role" FOREIGN KEY ("role_id")
          REFERENCES "roles" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_role_menu_permissions_menu" FOREIGN KEY ("menu_id")
          REFERENCES "menus" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "refresh_tokens" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "user_id" bigint NOT NULL,
        "company_id" bigint NOT NULL,
        "token_hash" varchar(128) NOT NULL,
        "expires_at" timestamptz NOT NULL,
        "revoked_at" timestamptz,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_refresh_tokens" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_refresh_tokens_token_hash" UNIQUE ("token_hash"),
        CONSTRAINT "FK_refresh_tokens_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_refresh_tokens_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE CASCADE
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "refresh_tokens"`);
    await queryRunner.query(`DROP TABLE "role_menu_permissions"`);
    await queryRunner.query(`DROP TABLE "menus"`);
    await queryRunner.query(`DROP TABLE "user_companies"`);
    await queryRunner.query(`DROP TABLE "roles"`);
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "companies"`);
  }
}
