import {
  DocumentBuilder,
  OpenAPIObject,
  SwaggerCustomOptions,
} from '@nestjs/swagger';
import { RuntimeConfig } from './configuration';

export const createSwaggerDocumentConfig = (
  swagger: RuntimeConfig['swagger'],
): Omit<OpenAPIObject, 'paths'> =>
  new DocumentBuilder()
    .setTitle(swagger.title)
    .setDescription(swagger.description)
    .setVersion(swagger.version)
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Paste access token as: Bearer <token>',
      },
      'access-token',
    )
    .build();

export const createSwaggerCustomOptions = (
  title: string,
): SwaggerCustomOptions => ({
  customSiteTitle: `${title} docs`,
  swaggerOptions: {
    persistAuthorization: true,
    filter: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    defaultModelsExpandDepth: 1,
  },
});
