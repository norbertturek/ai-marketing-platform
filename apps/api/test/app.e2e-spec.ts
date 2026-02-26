import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/hello (GET)', () => {
    return request(app.getHttpServer())
      .get('/api/hello')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            message: 'Backend is ready for frontend',
            status: 'ok',
            timestamp: expect.any(String),
          }),
        );
      });
  });

  it('allows frontend CORS preflight', () => {
    return request(app.getHttpServer())
      .options('/api/hello')
      .set('Origin', 'http://localhost:4200')
      .set('Access-Control-Request-Method', 'GET')
      .expect(204)
      .expect(({ headers }) => {
        expect(headers['access-control-allow-origin']).toBeDefined();
      });
  });

  it('registers, signs in, refreshes and signs out', async () => {
    const email = `auth-e2e-${Date.now()}@example.com`;
    const password = 'StrongPass123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    expect(registerResponse.body).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          email,
          id: expect.any(String),
        }),
        tokens: expect.objectContaining({
          accessToken: expect.any(String),
          refreshToken: expect.any(String),
        }),
      }),
    );

    const signInResponse = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({ email, password })
      .expect(200);

    const accessToken: string = signInResponse.body.tokens.accessToken;
    const refreshToken: string = signInResponse.body.tokens.refreshToken;

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect(({ body }) => {
        expect(body).toEqual(
          expect.objectContaining({
            userId: expect.any(String),
            email,
          }),
        );
      });

    const refreshResponse = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refreshToken })
      .expect(200);

    expect(refreshResponse.body.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshResponse.body.tokens.refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/auth/signout')
      .send({ refreshToken: refreshResponse.body.tokens.refreshToken })
      .expect(204);
  });
});
