import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TRANSACTION_MANAGER } from '@domain/core/ports/transaction-manager.port';
import { PASSWORD_HASHER } from '@domain/core/ports/password-hasher.port';
import { HASH_SERVICE } from '@domain/core/ports/hash.port';
import { TOKEN_GENERATOR } from '@domain/core/ports/token-generator.port';
import { TransactionManagerAdapter } from './persistence/transaction-manager.adapter';
import { PasswordHasherAdapter } from './security/password-hasher.adapter';
import { HashServiceAdapter } from './security/hash-service.adapter';
import { JwtTokenGeneratorAdapter } from './security/jwt-token-generator.adapter';
import { JwtAuthGuard } from './security/jwt-auth.guard';
import { GlobalExceptionFilter } from '@infrastructure/common/http/global-exception.filter';
import { ResponseInterceptor } from '@infrastructure/common/http/response.interceptor';

/**
 * Servicios singleton de infraestructura, compartidos por todos los módulos
 * de negocio: transacciones, hashing, tokens (JWT), el filtro global de
 * excepciones, el interceptor que arma la respuesta exitosa, y el guard que
 * protege por defecto toda ruta que no esté marcada con `@Public()` (Fase 9).
 * Se importa una sola vez, en AppModule (ver ARCHITECTURE.md §3).
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: {
          // ConfigService siempre devuelve strings del .env — hay que forzar
          // Number() explícito. `expiresIn` de jsonwebtoken interpreta un
          // string numérico como milisegundos (vía la librería `ms`), no
          // segundos: pasar "900" (string) en vez de 900 (number) hacía que
          // el token expirara en 0 segundos (iat === exp).
          expiresIn: Number(
            config.get<string>('JWT_ACCESS_EXPIRES_IN_SECONDS', '900'),
          ),
        },
      }),
    }),
  ],
  providers: [
    { provide: TRANSACTION_MANAGER, useClass: TransactionManagerAdapter },
    { provide: PASSWORD_HASHER, useClass: PasswordHasherAdapter },
    { provide: HASH_SERVICE, useClass: HashServiceAdapter },
    { provide: TOKEN_GENERATOR, useClass: JwtTokenGeneratorAdapter },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
  exports: [
    TRANSACTION_MANAGER,
    PASSWORD_HASHER,
    HASH_SERVICE,
    TOKEN_GENERATOR,
  ],
})
export class CoreModule {}
