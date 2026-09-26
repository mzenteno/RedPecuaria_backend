import { join } from 'path';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServeStaticModule } from '@nestjs/serve-static';
import { CoreModule } from '@infrastructure/core/core.module';
import { CompanyModule } from '@infrastructure/company/company.module';
import { UserModule } from '@infrastructure/user/user.module';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { PropertyModule } from '@infrastructure/property/property.module';
import { InvestmentModule } from '@infrastructure/investment/investment.module';
import { KardexModule } from '@infrastructure/kardex/kardex.module';
import { DashboardModule } from '@infrastructure/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get<string>('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD', 'postgres'),
        database: config.get<string>('DB_NAME', 'RedPecuaria'),
        autoLoadEntities: true,
        synchronize: config.get<string>('DB_SYNCHRONIZE', 'false') === 'true',
        // `migrationsRun: true`: corre las migraciones pendientes al
        // arrancar la conexión, antes de que la app empiece a recibir
        // peticiones — mismo criterio que Flyway en Spring Boot (ver
        // ARCHITECTURE.md §12 para el porqué, incluida la alternativa
        // descartada: el "Pre-Deploy Command" de Render es solo para
        // instancias pagas). Si una migración falla, la app no llega a
        // arrancar — mejor eso que servir tráfico contra un esquema
        // desactualizado. El glob `*{.ts,.js}` con `__dirname` sirve para
        // los dos casos sin duplicar config: en desarrollo (`nest start
        // --watch`, vía ts-node) `__dirname` resuelve a `src/` y matchea
        // los `.ts`; ya compilado (`node dist/main`) resuelve a `dist/` y
        // matchea los `.js`.
        migrations: [join(__dirname, 'migrations/*{.ts,.js}')],
        migrationsRun: true,
        // Managed Postgres (Neon, Render, Supabase, etc.) exige SSL — el
        // certificado de esos proveedores no es de una CA reconocida por
        // Node, así que hace falta `rejectUnauthorized: false` (no hay MITM
        // real: la conexión sigue viajando cifrada, solo no se valida la
        // cadena de certificados). En local (`DB_SSL` sin setear) queda
        // deshabilitado, como hasta ahora.
        ssl:
          config.get<string>('DB_SSL', 'false') === 'true'
            ? { rejectUnauthorized: false }
            : false,
      }),
    }),
    // Sirve `<cwd>/uploads/**` en `/uploads/**` — hoy el logo de una empresa
    // (ver `LocalFileStorageAdapter`), sin passar por ningún guard de Nest:
    // es contenido público por naturaleza (una imagen que se muestra en un
    // <img> o en un PDF, sin token). Middleware de Express montado directo
    // por este módulo, corre ANTES del pipeline de Nest (guards incluidos)
    // para cualquier request que matchee `/uploads/*` — no hace falta
    // `@Public()` en ningún controlador para esto.
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    CoreModule,
    CompanyModule,
    UserModule,
    AuthModule,
    PropertyModule,
    InvestmentModule,
    KardexModule,
    DashboardModule,
  ],
})
export class AppModule {}
