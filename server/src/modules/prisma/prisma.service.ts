import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const isDev = configService.get('nodeEnv') === 'development';

    const logLevels: Prisma.LogLevel[] = isDev
      ? ['query', 'warn', 'error']
      : ['warn', 'error'];

    super({
      log: logLevels.map((level) => ({
        emit: 'event' as const,
        level,
      })),
    });

    if (isDev) {
      (this as any).$on('query', (e: Prisma.QueryEvent) => {
        this.logger.debug(`${e.query} — ${e.duration}ms`);
      });
    }

    (this as any).$on('warn', (e: Prisma.LogEvent) => {
      this.logger.warn(e.message);
    });

    (this as any).$on('error', (e: Prisma.LogEvent) => {
      this.logger.error(e.message);
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }
}
