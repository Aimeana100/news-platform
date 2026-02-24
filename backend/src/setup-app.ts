import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { RuntimeConfig } from './config/configuration';

const getCorsOrigin = (origins: string[]): boolean | string[] => {
  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return origins;
};

export function setupApp(app: INestApplication): void {
  const configService = app.get(ConfigService<RuntimeConfig, true>);

  const apiPrefix = configService.get('app.apiPrefix', { infer: true });
  const corsOrigins = configService.get('app.corsOrigins', { infer: true });
  const trustProxy = configService.get('app.trustProxy', { infer: true });
  const swaggerEnabled = configService.get('swagger.enabled', { infer: true });

  app.use(helmet());
  app.enableShutdownHooks();
  app.setGlobalPrefix(apiPrefix);
  app.enableCors({
    origin: getCorsOrigin(corsOrigins),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  if (trustProxy) {
    const adapterInstance = app.getHttpAdapter().getInstance() as {
      set?: (key: string, value: number) => void;
    };
    adapterInstance.set?.('trust proxy', 1);
  }

  if (swaggerEnabled) {
    const title = configService.get('swagger.title', { infer: true });
    const description = configService.get('swagger.description', {
      infer: true,
    });
    const version = configService.get('swagger.version', { infer: true });
    const path = configService.get('swagger.path', { infer: true });

    const swaggerConfig = new DocumentBuilder()
      .setTitle(title)
      .setDescription(description)
      .setVersion(version)
      .build();

    const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig, {
      deepScanRoutes: true,
    });

    SwaggerModule.setup(path, app, swaggerDocument, {
      customSiteTitle: `${title} docs`,
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }
}
