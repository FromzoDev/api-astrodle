import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { Role } from '../src/common/enum/roles.enum';
import { GameType } from '../src/common/enum/game-type.enum';
import { GameMode } from '../src/common/enum/game-mode.enum';

describe('Dashboard (e2e)', () => {
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

  describe('GET /api/dashboard/games-overview', () => {
    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer())
        .get('/api/dashboard/games-overview')
        .query({ mode: GameMode.Daily })
        .expect(401);
    });

    it('rejects a Moderator (Admin only)', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/dashboard/games-overview')
        .query({ mode: GameMode.Daily })
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns an overview entry per game type for an Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      const res = await request(app.getHttpServer())
        .get('/api/dashboard/games-overview')
        .query({ mode: GameMode.Daily })
        .set('Authorization', bearer(token))
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
      expect(
        res.body.data.some(
          (entry: any) => entry.gameType === GameType.GuessSkyObject,
        ),
      ).toBe(true);
    });
  });
});
