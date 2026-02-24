import {
  BadRequestException,
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import {
  createSwaggerCustomOptions,
  createSwaggerDocumentConfig,
} from './config/swagger.config';
import { RuntimeConfig } from './config/configuration';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

const getCorsOrigin = (origins: string[]): boolean | string[] => {
  if (origins.length === 0 || origins.includes('*')) {
    return true;
  }

  return origins;
};

const flattenValidationErrors = (
  validationErrors: ValidationError[],
): string[] => {
  return validationErrors.flatMap((error) => {
    const currentConstraints = Object.values(error.constraints ?? {});
    const childConstraints = flattenValidationErrors(error.children ?? []);

    return [...currentConstraints, ...childConstraints];
  });
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
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          Success: false,
          Message: 'Validation failed',
          Object: null,
          Errors: flattenValidationErrors(errors),
        }),
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  if (trustProxy) {
    const adapterInstance = app.getHttpAdapter().getInstance() as {
      set?: (key: string, value: number) => void;
    };
    adapterInstance.set?.('trust proxy', 1);
  }

  if (swaggerEnabled) {
    const swaggerConfig = configService.get('swagger', {
      infer: true,
    });

    const swaggerDocument = SwaggerModule.createDocument(
      app,
      createSwaggerDocumentConfig(swaggerConfig),
      {
        deepScanRoutes: true,
        operationIdFactory: (controllerKey, methodKey) =>
          `${controllerKey}_${methodKey}`,
      },
    );

    SwaggerModule.setup(
      swaggerConfig.path,
      app,
      swaggerDocument,
      createSwaggerCustomOptions(swaggerConfig.title),
    );
  }
}
