import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `logo_url` es la URL pública absoluta del logo ya guardado (ver
 * `LocalFileStorageAdapter`), no el archivo en sí — nullable, la mayoría de
 * las empresas empiezan sin logo cargado. Ver
 * `docs/company/changes/2026-09-26-logo-de-empresa.md`.
 */
export class AddLogoUrlToCompanies1789100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" ADD COLUMN "logo_url" varchar(500)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" DROP COLUMN "logo_url"
    `);
  }
}
