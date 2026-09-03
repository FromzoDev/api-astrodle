import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { Role } from '../src/common/enum/roles.enum';

// Uses /api/users as a representative Auth(Role.Moderator)-protected route,
// /api/users/profile as a representative Auth()-only (any authenticated role) route,
// and /api/dashboard/games-overview as a representative Auth(Role.Admin) route.
describe('Guards (e2e)', () => {
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

  describe('AuthGuard', () => {
    it('rejects a request without an Authorization header', async () => {
      await request(app.getHttpServer()).get('/api/users').expect(401);
    });

    it('rejects a malformed Authorization header', async () => {
      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', 'not-a-bearer-token')
        .expect(401);
    });

    it('rejects a token signed with a different secret', async () => {
      const rogueJwtService = new JwtService({
        secret: 'a-completely-different-secret',
      });
      const forgedToken = rogueJwtService.sign({ sub: 1, roles: [Role.Admin] });

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(forgedToken))
        .expect(401);
    });

    it('rejects a token belonging to a deleted/unknown user', async () => {
      const jwtService = app.get(JwtService);
      const token = jwtService.sign({ sub: 999999, roles: [Role.Admin] });

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(401);
    });

    it('accepts a valid token for a public-ish authenticated-only route', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', bearer(token))
        .expect(200);
    });
  });

  describe('RolesGuard', () => {
    it('rejects an insufficient role', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('accepts the exact required role', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(200);
    });

    it('accepts a higher role thanks to the role hierarchy', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(200);
    });

    it('rejects a Moderator on an Admin-only route', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/dashboard/games-overview')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('accepts an Admin on an Admin-only route', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .get('/api/dashboard/games-overview')
        .set('Authorization', bearer(token))
        .expect(200);
    });
  });
});
