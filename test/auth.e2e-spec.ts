import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import {
  createUser,
  DEFAULT_TEST_PASSWORD,
  signAccessToken,
  signRefreshToken,
  bearer,
} from './utils/auth.util';
import { Role } from '../src/common/enum/roles.enum';
import { User } from '../src/users/user.entity';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
  });

  describe('POST /api/auth/login', () => {
    it('returns access and refresh tokens on valid credentials', async () => {
      const user = await createUser(app, { email: 'login@test.com' });

      const res = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: DEFAULT_TEST_PASSWORD })
        .expect(200);

      expect(res.body.data.access_token).toEqual(expect.any(String));
      expect(res.body.data.refresh_token).toEqual(expect.any(String));
    });

    it('rejects a wrong password', async () => {
      const user = await createUser(app, { email: 'wrongpass@test.com' });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: 'not-the-password' })
        .expect(401);
    });

    it('rejects an unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'unknown@test.com', password: DEFAULT_TEST_PASSWORD })
        .expect(401);
    });

    it('rejects a disabled account', async () => {
      const user = await createUser(app, {
        email: 'disabled@test.com',
        isActive: false,
      });

      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: user.email, password: DEFAULT_TEST_PASSWORD })
        .expect(401);
    });

    it('rejects an invalid body', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'not-an-email' })
        .expect(400);
    });

    it('throttles after too many attempts', async () => {
      // Uses its own app instance: the throttler's in-memory storage is shared
      // across every login call made against `app` in this file, so reusing it
      // here would make the attempt count depend on test order.
      const throttleApp = await createTestApp();
      try {
        const throttleDataSource = throttleApp.get(DataSource);
        await clearDatabase(throttleDataSource);
        const user = await createUser(throttleApp, {
          email: 'throttle@test.com',
        });
        const attempt = () =>
          request(throttleApp.getHttpServer())
            .post('/api/auth/login')
            .send({ email: user.email, password: 'wrong' });

        for (let i = 0; i < 5; i++) {
          await attempt();
        }

        await attempt().expect(429);
      } finally {
        await throttleApp.close();
      }
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns a new token pair given a valid refresh token', async () => {
      const user = await createUser(app, { email: 'refresh@test.com' });
      const refreshToken = signRefreshToken(app, user);

      const res = await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(200);

      expect(res.body.data.access_token).toEqual(expect.any(String));
      expect(res.body.data.refresh_token).toEqual(expect.any(String));
    });

    it('rejects an access token used as a refresh token', async () => {
      const user = await createUser(app, { email: 'notrefresh@test.com' });
      const accessToken = signAccessToken(app, user);

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: accessToken })
        .expect(401);
    });

    it('rejects a garbage token', async () => {
      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: 'not-a-jwt' })
        .expect(401);
    });

    it('rejects a refresh token for a now-disabled user', async () => {
      const user = await createUser(app, {
        email: 'disabledrefresh@test.com',
        isActive: true,
      });
      const refreshToken = signRefreshToken(app, user);

      await dataSource.getRepository(User).update(user.id, { isActive: false });

      await request(app.getHttpServer())
        .post('/api/auth/refresh')
        .send({ refresh_token: refreshToken })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('rejects when unauthenticated', async () => {
      await request(app.getHttpServer()).post('/api/auth/logout').expect(401);
    });

    it('blacklists the access token so it cannot be reused', async () => {
      const user = await createUser(app, {
        email: 'logout@test.com',
        roles: [Role.Admin],
      });
      const token = signAccessToken(app, user);

      await request(app.getHttpServer())
        .post('/api/auth/logout')
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', bearer(token))
        .expect(401);
    });
  });
});
