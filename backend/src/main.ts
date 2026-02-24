import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { RuntimeConfig } from './config/configuration';
import { setupApp } from './setup-app';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  const logger = new Logger('Bootstrap');

  setupApp(app);

  const configService = app.get(ConfigService<RuntimeConfig, true>);

  const host = configService.get('app.host', { infer: true });
  const port = configService.get('app.port', { infer: true });
  const apiPrefix = configService.get('app.apiPrefix', { infer: true });
  const swaggerEnabled = configService.get('swagger.enabled', { infer: true });
  const swaggerPath = configService.get('swagger.path', { infer: true });

  await app.listen(port, host);

  const localAddress = host === '0.0.0.0' ? 'localhost' : host;
  logger.log(`API listening at http://${localAddress}:${port}/${apiPrefix}`);

  if (swaggerEnabled) {
    logger.log(`Swagger docs at http://${localAddress}:${port}/${swaggerPath}`);
  }
}

void bootstrap();
