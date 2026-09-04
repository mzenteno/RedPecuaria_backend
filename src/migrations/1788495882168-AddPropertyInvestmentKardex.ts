import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Primer módulo del negocio ganadero en sí (hasta ahora todo era
 * administración/plataforma: empresas, usuarios, roles, permisos). Fase 1
 * deliberadamente simple — ver docs/property, docs/investment: solo carga
 * de datos, sin ningún cálculo (ni saldos corridos, ni reparto entre
 * inversionistas, ni el modelo de negocio 45/55, que es fijo para toda la
 * app y todavía no se usa en ningún lado).
 *
 * - `properties` (Propiedad/finca): pertenece a una empresa, tiene
 *   ubicación (lat/lng) para mostrarla en un mapa.
 * - `investments` (Inversión): el negocio de compra de ganado enviado a una
 *   propiedad. `gestion` es un año (número), no texto libre — se muestra en
 *   un combobox en el frontend. No hay campo "lote": `description` es libre
 *   para que el usuario diferencie inversiones de la misma propiedad como
 *   quiera.
 * - `investment_investors`: uno o más usuarios (tipo Inversionista) por
 *   inversión — sin porcentaje de aporte todavía.
 * - `kardex_entries`: cada fila del kardex de inventario de ganado (ver la
 *   planilla de referencia) — todos los campos los tipea el usuario a
 *   mano, ninguno se calcula.
 */
export class AddPropertyInvestmentKardex1788495882168 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "properties" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "company_id" bigint NOT NULL,
        "name" varchar(255) NOT NULL,
        "latitude" numeric(10,7) NOT NULL,
        "longitude" numeric(10,7) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_properties" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_properties_company_name" UNIQUE ("company_id", "name"),
        CONSTRAINT "FK_properties_company" FOREIGN KEY ("company_id")
          REFERENCES "companies" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "investments" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "property_id" bigint NOT NULL,
        "gestion" integer NOT NULL,
        "description" varchar(255) NOT NULL,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_investments" PRIMARY KEY ("id"),
        CONSTRAINT "FK_investments_property" FOREIGN KEY ("property_id")
          REFERENCES "properties" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "investment_investors" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "investment_id" bigint NOT NULL,
        "user_id" bigint NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_investment_investors" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_investment_investors_investment_user" UNIQUE ("investment_id", "user_id"),
        CONSTRAINT "FK_investment_investors_investment" FOREIGN KEY ("investment_id")
          REFERENCES "investments" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_investment_investors_user" FOREIGN KEY ("user_id")
          REFERENCES "users" ("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "kardex_entries" (
        "id" bigint GENERATED ALWAYS AS IDENTITY,
        "investment_id" bigint NOT NULL,
        "entry_date" date NOT NULL,
        "detail" varchar(255) NOT NULL,
        "avg_weight" numeric(10,2) NOT NULL DEFAULT 0,
        "entry_quantity" integer NOT NULL DEFAULT 0,
        "entry_kilos" numeric(12,2) NOT NULL DEFAULT 0,
        "exit_quantity" integer NOT NULL DEFAULT 0,
        "exit_kilos" numeric(12,2) NOT NULL DEFAULT 0,
        "balance_quantity" integer NOT NULL DEFAULT 0,
        "balance_kilos" numeric(12,2) NOT NULL DEFAULT 0,
        "total" numeric(14,2) NOT NULL DEFAULT 0,
        "is_deleted" boolean NOT NULL DEFAULT false,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "PK_kardex_entries" PRIMARY KEY ("id"),
        CONSTRAINT "FK_kardex_entries_investment" FOREIGN KEY ("investment_id")
          REFERENCES "investments" ("id") ON DELETE CASCADE
      )
    `);

    // Catálogo de menús: "Propiedades" e "Inversiones", bajo "Administración"
    // (mismo grupo que Empresas/Usuarios/Roles/Permisos — es la sección de
    // gestión, a diferencia de Dashboard). `can_view` a todos los roles
    // existentes, igual criterio que AddDashboardMenu: los roles nuevos
    // necesitan que se les conceda a mano vía la pantalla de Permisos.
    const [adminMenu] = await queryRunner.query(
      `SELECT "id" FROM "menus" WHERE "key" = 'administration'`,
    );
    const [propertiesMenu] = await queryRunner.query(
      `INSERT INTO "menus" ("key", "label", "path", "parent_id", "order")
       VALUES ('properties', 'Propiedades', '/properties', $1, 5)
       RETURNING "id"`,
      [adminMenu.id],
    );
    const [investmentsMenu] = await queryRunner.query(
      `INSERT INTO "menus" ("key", "label", "path", "parent_id", "order")
       VALUES ('investments', 'Inversiones', '/investments', $1, 6)
       RETURNING "id"`,
      [adminMenu.id],
    );

    const roles: Array<{ id: string }> = await queryRunner.query(
      `SELECT "id" FROM "roles"`,
    );
    for (const role of roles) {
      for (const menu of [propertiesMenu, investmentsMenu]) {
        await queryRunner.query(
          `INSERT INTO "role_menu_permissions"
             ("role_id", "menu_id", "can_view", "can_create", "can_edit", "can_delete")
           VALUES ($1, $2, true, true, true, true)`,
          [role.id, menu.id],
        );
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "role_menu_permissions" WHERE "menu_id" IN (
         SELECT "id" FROM "menus" WHERE "key" IN ('properties', 'investments')
       )`,
    );
    await queryRunner.query(
      `DELETE FROM "menus" WHERE "key" IN ('properties', 'investments')`,
    );
    await queryRunner.query(`DROP TABLE "kardex_entries"`);
    await queryRunner.query(`DROP TABLE "investment_investors"`);
    await queryRunner.query(`DROP TABLE "investments"`);
    await queryRunner.query(`DROP TABLE "properties"`);
  }
}
