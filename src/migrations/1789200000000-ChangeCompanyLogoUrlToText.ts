import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * `logo_url` deja de ser una URL (que apuntaba a un archivo en disco local)
 * para pasar a guardar la imagen misma como `data:` URI en base64 — a
 * pedido del usuario, tras descubrir en producción (Render) que el disco
 * local de un servicio web es efímero: se borra en cada deploy/reinicio, así
 * que cualquier logo subido desaparecía apenas se volvía a desplegar. Ver
 * `docs/company/changes/2026-09-26-logo-en-base64-no-en-disco.md`.
 *
 * `varchar(500)` alcanzaba para una URL, pero un `data:` URI de una imagen
 * de hasta 2 MB en base64 puede rondar los 2,7 MB de texto — hace falta
 * `text` (sin límite práctico en Postgres).
 */
export class ChangeCompanyLogoUrlToText1789200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "logo_url" TYPE text
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "companies" ALTER COLUMN "logo_url" TYPE varchar(500)
    `);
  }
}
