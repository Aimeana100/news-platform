import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RuntimeConfig } from './config/configuration';

export interface ApiMetadataResponse {
  name: string;
  version: string;
  environment: RuntimeConfig['nodeEnv'];
  apiBasePath: string;
  docsPath: string;
  healthPath: string;
}

@Injectable()
export class AppService {
  constructor(
    private readonly configService: ConfigService<RuntimeConfig, true>,
  ) {}

  getApiMetadata(): ApiMetadataResponse {
    const name = this.configService.get('app.name', { infer: true });
    const version = this.configService.get('app.version', { infer: true });
    const environment = this.configService.get('nodeEnv', { infer: true });
    const apiPrefix = this.configService.get('app.apiPrefix', { infer: true });
    const swaggerPath = this.configService.get('swagger.path', { infer: true });

    return {
      name,
      version,
      environment,
      apiBasePath: `/${apiPrefix}`,
      docsPath: `/${swaggerPath}`,
      healthPath: '/health',
    };
  }
}
