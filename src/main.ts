import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  const config = app.get(ConfigService);
  // CORS_ORIGIN=* sirve para desarrollo; restringir a los dominios reales del
  // frontend antes de producción (ver .env.example).
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN', '*') });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
