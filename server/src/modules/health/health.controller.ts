import { Controller, Get } from '@nestjs/common';
import { Public } from '@common/decorators/public.decorator';
import { PrismaService } from '@modules/prisma/prisma.service';
import { RedisService } from '@modules/redis/redis.service';

interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  services: {
    database: string;
    redis: string;
  };
}

@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  @Public()
  @Get()
  async check(): Promise<HealthStatus> {
    const [dbStatus, redisStatus] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const isHealthy =
      dbStatus.status === 'fulfilled' && redisStatus.status === 'fulfilled';

    return {
      status: isHealthy ? 'ok' : 'degraded',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus.status === 'fulfilled' ? 'ok' : 'down',
        redis: redisStatus.status === 'fulfilled' ? 'ok' : 'down',
      },
    };
  }

  private async checkDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }

  private async checkRedis(): Promise<void> {
    await this.redis.ping();
  }
}
