process.env.NODE_ENV ??= 'test';
process.env.DATABASE_URL ??=
  'postgresql://postgres:postgres@localhost:5432/news_platform?schema=public';
process.env.REDIS_URL ??= 'redis://localhost:6379';
process.env.JWT_SECRET ??= 'test-jwt-secret-with-at-least-32-chars';

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { setupApp } from '../src/setup-app';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupApp(app);
    await app.init();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/v1 (GET)', () => {
    return request(app.getHttpServer()).get('/api/v1').expect(200).expect({
      name: 'news-platform-backend',
      version: '1.0.0',
      environment: 'test',
      apiBasePath: '/api/v1',
      docsPath: '/docs',
      healthPath: '/health',
    });
  });

  it('/api/v1/auth/signup (POST) should validate payload and return structured errors', () => {
    return request(app.getHttpServer())
      .post('/api/v1/auth/signup')
      .send({
        name: '123',
        email: 'invalid-email',
        password: 'weak',
        role: 'admin',
      })
      .expect(400)
      .expect(({ body }: { body: { Success: boolean; Errors: string[] } }) => {
        expect(body).toMatchObject({
          Success: false,
        });
        expect(body.Errors).toEqual(
          expect.arrayContaining([
            'name must contain only alphabets and single spaces.',
            'email must be a valid email address.',
            "role must be either 'author' or 'reader'.",
            'password must be at least 8 characters long.',
            'password must contain at least one uppercase letter.',
          ]),
        );
      });
  });
});
