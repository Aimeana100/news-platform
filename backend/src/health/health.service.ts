import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { RuntimeConfig } from '../config/configuration';
import { PrismaService } from '../prisma/prisma.service';

type CheckStatus = 'up' | 'down';

interface DependencyCheck {
  status: CheckStatus;
  latencyMs: number;
  error?: string;
}

interface ReadinessChecks {
  database: DependencyCheck;
  redis: DependencyCheck;
}

export interface LivenessResponse {
  status: 'ok';
  timestamp: string;
}

export interface ReadinessResponse {
  status: 'ok' | 'error';
  timestamp: string;
  checks: ReadinessChecks;
}

@Injectable()
export class HealthService implements OnModuleDestroy {
  private readonly logger = new Logger(HealthService.name);
  private readonly redisClient: Redis;

  constructor(
    private readonly prisma: PrismaService,
    configService: ConfigService<RuntimeConfig, true>,
  ) {
    const redisUrl = configService.get('redis.url', { infer: true });
    this.redisClient = new Redis(redisUrl, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
    });
    this.redisClient.on('error', (error: unknown) => {
      this.logger.warn(`Redis client error: ${this.formatError(error)}`);
    });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.redisClient.status === 'ready') {
      await this.redisClient.quit();
      return;
    }

    if (this.redisClient.status !== 'end') {
      this.redisClient.disconnect();
    }
  }

  getLiveness(): LivenessResponse {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness(): Promise<ReadinessResponse> {
    const [database, redis] = await Promise.all([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    const status: ReadinessResponse['status'] =
      database.status === 'up' && redis.status === 'up' ? 'ok' : 'error';

    return {
      status,
      timestamp: new Date().toISOString(),
      checks: {
        database,
        redis,
      },
    };
  }

  private async checkDatabase(): Promise<DependencyCheck> {
    const start = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      const message = this.formatError(error);
      this.logger.error(`Database readiness check failed: ${message}`);

      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: message,
      };
    }
  }

  private async checkRedis(): Promise<DependencyCheck> {
    const start = Date.now();

    try {
      if (this.redisClient.status === 'wait') {
        await this.redisClient.connect();
      }

      const pingResult = await this.redisClient.ping();
      if (pingResult !== 'PONG') {
        throw new Error(
          `Unexpected Redis ping response: ${String(pingResult)}`,
        );
      }

      return {
        status: 'up',
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      const message = this.formatError(error);
      this.logger.error(`Redis readiness check failed: ${message}`);

      return {
        status: 'down',
        latencyMs: Date.now() - start,
        error: message,
      };
    }
  }

  private formatError(error: unknown): string {
    if (error instanceof Error) {
      const details = error.message.trim();
      const code = this.getErrorCode(error);

      if (details.length > 0) {
        return code ? `${details} (code: ${code})` : details;
      }

      return code ? `${error.name} (code: ${code})` : error.name;
    }

    return 'Unknown error';
  }

  private getErrorCode(error: Error): string | null {
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' && maybeCode.length > 0
      ? maybeCode
      : null;
  }
}
