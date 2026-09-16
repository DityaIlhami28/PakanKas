import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { validateEnvironment } from './config/env';

async function bootstrap() {
  validateEnvironment();
  const app = await NestFactory.create(AppModule);
  const clientOrigin =
    process.env.CLIENT_ORIGIN ??
    (process.env.NODE_ENV === 'production'
      ? undefined
      : 'http://localhost:3000');

  if (!clientOrigin) {
    throw new Error('Missing required environment variable: CLIENT_ORIGIN');
  }

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.use(cookieParser());
  app.enableCors({
    origin: clientOrigin,
    credentials: true,
  });

  await app.listen(Number(process.env.PORT ?? 3001));
}

void bootstrap().catch((error: unknown) => {
  const logger = new Logger('Bootstrap');
  logger.error(
    error instanceof Error ? error.message : 'Application failed to start',
  );
  process.exitCode = 1;
});
