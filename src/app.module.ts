import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '@infrastructure/core/core.module';
import { CompanyModule } from '@infrastructure/company/company.module';
import { UserModule } from '@infrastructure/user/user.module';
import { AuthModule } from '@infrastructure/auth/auth.module';
import { PropertyModule } from '@infrastructure/property/property.module';
import { InvestmentModule } from '@infrastructure/investment/investment.module';
import { KardexModule } from '@infrastructure/kardex/kardex.module';

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
    CoreModule,
    CompanyModule,
    UserModule,
    AuthModule,
    PropertyModule,
    InvestmentModule,
    KardexModule,
  ],
})
export class AppModule {}
