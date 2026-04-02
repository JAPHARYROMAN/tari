import {
  Injectable,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('redis.url');

    if (redisUrl) {
      // Managed Redis (Render, Railway, Upstash, etc.)
      super(redisUrl, {
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          return Math.min(times * 200, 5000);
        },
        tls: redisUrl.startsWith('rediss://') ? {} : undefined,
      });
    } else {
      // Individual host/port/password
      const host = configService.get<string>('redis.host', 'localhost');
      const port = configService.get<number>('redis.port', 6379);
      const password = configService.get<string>('redis.password', '');

      super({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy(times: number) {
          return Math.min(times * 200, 5000);
        },
      });
    }

    this.on('connect', () => {
      this.logger.log('Connected to Redis');
    });

    this.on('error', (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
    this.logger.log('Disconnected from Redis');
  }
}
