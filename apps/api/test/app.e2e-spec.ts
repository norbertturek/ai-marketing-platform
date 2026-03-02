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
      .expect((res: { body: unknown }) => {
        const body = res.body as Record<string, unknown>;
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
      .expect((res: { headers: Record<string, unknown> }) => {
        expect(res.headers['access-control-allow-origin']).toBeDefined();
      });
  });

  it('registers, signs in, refreshes and signs out', async () => {
    const email = `auth-e2e-${Date.now()}@example.com`;
    const password = 'StrongPass123';

    const registerResponse = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    const registerBody = registerResponse.body as Record<string, unknown>;
    expect(registerBody).toEqual(
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

    const signInBody = signInResponse.body as {
      tokens: { accessToken: string; refreshToken: string };
    };
    const accessToken = signInBody.tokens.accessToken;
    const refreshToken = signInBody.tokens.refreshToken;

    await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200)
      .expect((res: { body: unknown }) => {
        const body = res.body as Record<string, unknown>;
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

    const refreshBody = refreshResponse.body as {
      tokens: { accessToken: string; refreshToken: string };
    };
    expect(refreshBody.tokens.accessToken).toEqual(expect.any(String));
    expect(refreshBody.tokens.refreshToken).toEqual(expect.any(String));

    await request(app.getHttpServer())
      .post('/api/auth/signout')
      .send({ refreshToken: refreshBody.tokens.refreshToken })
      .expect(204);
  });

  it('lists and creates projects when authenticated', async () => {
    const email = `projects-e2e-${Date.now()}@example.com`;
    const password = 'StrongPass123';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password })
      .expect(201);

    const signInRes = await request(app.getHttpServer())
      .post('/api/auth/signin')
      .send({ email, password })
      .expect(200);

    const tokens = signInRes.body as {
      tokens: { accessToken: string; refreshToken: string };
    };
    const accessToken = tokens.tokens.accessToken;

    const listRes = await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listRes.body).toEqual([]);

    const createRes = await request(app.getHttpServer())
      .post('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ name: 'E2E Project', description: 'Test project' })
      .expect(201);

    const created = createRes.body as Record<string, unknown>;
    expect(created).toMatchObject({
      name: 'E2E Project',
      description: 'Test project',
      itemsCount: 0,
    });
    expect(created.id).toBeDefined();
    expect(created.createdAt).toBeDefined();

    const listAfterRes = await request(app.getHttpServer())
      .get('/api/projects')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(listAfterRes.body).toHaveLength(1);
    expect((listAfterRes.body as Record<string, unknown>[])[0]).toMatchObject({
      name: 'E2E Project',
      itemsCount: 0,
    });
  });
});
