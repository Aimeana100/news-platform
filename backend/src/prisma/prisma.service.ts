import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { RuntimeConfig } from '../config/configuration';
import { NodeEnvironment } from '../config/env.validation';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor(
    private readonly configService: ConfigService<RuntimeConfig, true>,
  ) {
    const nodeEnv = configService.get('nodeEnv', { infer: true });
    const databaseUrl = configService.get('database.url', { infer: true });
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
    });

    super({
      adapter,
      log:
        nodeEnv === NodeEnvironment.Production
          ? ['warn', 'error']
          : ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit(): Promise<void> {
    const nodeEnv = this.configService.get('nodeEnv', { infer: true });
    if (nodeEnv === NodeEnvironment.Test) {
      return;
    }

    await this.$connect();
    this.logger.log('Connected to PostgreSQL via Prisma.');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected Prisma client.');
  }
}
