import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import { RuntimeConfig } from '../config/configuration';
import { createWinstonLoggerOptions } from './winston.config';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService<RuntimeConfig, true>) =>
        createWinstonLoggerOptions(configService),
    }),
  ],
})
export class LoggingModule {}
