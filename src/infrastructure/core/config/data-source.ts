import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config();

/**
 * DataSource usado exclusivamente por el CLI de TypeORM (fuera del contexto
 * de Nest) para generar y correr migraciones. La app en runtime usa su propio
 * TypeOrmModule.forRootAsync (ver app.module.ts).
 */
export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'RedPecuaria',
  entities: ['src/**/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  synchronize: false,
  // Mismo criterio que app.module.ts: necesario para correr migraciones
  // (`migration:run`) contra un Postgres administrado (Neon, Render, etc.).
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});
