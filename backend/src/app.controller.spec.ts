import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const configValues: Record<string, unknown> = {
      'app.name': 'news-platform-backend',
      'app.version': '1.0.0',
      nodeEnv: 'test',
      'app.apiPrefix': 'api/v1',
      'swagger.path': 'docs',
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: {
            get: (key: string): unknown => configValues[key],
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return service metadata', () => {
      expect(appController.getMetadata()).toEqual({
        name: 'news-platform-backend',
        version: '1.0.0',
        environment: 'test',
        apiBasePath: '/api/v1',
        docsPath: '/docs',
        healthPath: '/health',
      });
    });
  });
});
