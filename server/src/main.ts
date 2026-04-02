import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as compression from 'compression';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: getLogLevels(process.env.LOG_LEVEL),
  });
  const configService = app.get(ConfigService);
  const isProduction = configService.get('nodeEnv') === 'production';

  // Global prefix
  app.setGlobalPrefix('api');

  // Trust proxy — required for correct IP detection and secure cookies behind reverse proxies
  if (isProduction) {
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.set('trust proxy', 1);
  }

  // Security headers
  app.use(helmet());

  // Gzip compression
  app.use(compression());

  // CORS
  const clientUrl = configService.get<string>('clientUrl')!;
  const extraOrigins = configService.get<string>('corsAllowedOrigins');
  const allowedOrigins = [clientUrl];
  if (extraOrigins) {
    allowedOrigins.push(
      ...extraOrigins.split(',').map((o) => o.trim()).filter(Boolean),
    );
  }

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Graceful shutdown
  app.enableShutdownHooks();

  const port = configService.get<number>('port', 4000);
  await app.listen(port);

  logger.log(`Tari server running on port ${port}`);
  logger.log(`Environment: ${configService.get('nodeEnv')}`);
  logger.log(`CORS origins: ${allowedOrigins.join(', ')}`);
  logger.log(`Health check: http://localhost:${port}/api/health`);
}

function getLogLevels(level?: string): LogLevel[] {
  const levels: LogLevel[] = ['error', 'warn', 'log', 'debug', 'verbose'];
  const idx = levels.indexOf((level as LogLevel) ?? 'log');
  return idx === -1 ? ['error', 'warn', 'log'] : levels.slice(0, idx + 1);
}

bootstrap();
