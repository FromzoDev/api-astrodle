import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { seedGameConfig } from './utils/fixtures.util';
import { Role } from '../src/common/enum/roles.enum';
import { GameType } from '../src/common/enum/game-type.enum';
import { GameMode } from '../src/common/enum/game-mode.enum';

describe('GameConfig (e2e)', () => {
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

  describe('GET /api/games/config', () => {
    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer()).get('/api/games/config').expect(401);
    });

    it('rejects a Moderator (Admin only)', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/games/config')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns the configs for an Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      await seedGameConfig(dataSource, GameType.GuessSkyObject, GameMode.Daily);

      const res = await request(app.getHttpServer())
        .get('/api/games/config')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/games/config', () => {
    it('creates a config as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      const res = await request(app.getHttpServer())
        .post('/api/games/config')
        .set('Authorization', bearer(token))
        .send({
          gameType: GameType.GuessSkyObject,
          mode: GameMode.Casual,
          isEnabled: true,
        })
        .expect(201);

      expect(res.body.data.gameType).toBe(GameType.GuessSkyObject);
      expect(res.body.data.mode).toBe(GameMode.Casual);
    });

    it('rejects a duplicate gameType/mode combination', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      await seedGameConfig(dataSource, GameType.GuessSkyObject, GameMode.Daily);

      await request(app.getHttpServer())
        .post('/api/games/config')
        .set('Authorization', bearer(token))
        .send({ gameType: GameType.GuessSkyObject, mode: GameMode.Daily })
        .expect(409);
    });

    it('rejects an invalid gameType', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .post('/api/games/config')
        .set('Authorization', bearer(token))
        .send({ gameType: 'not-a-type', mode: GameMode.Daily })
        .expect(400);
    });
  });

  describe('PATCH /api/games/config/:id', () => {
    it('toggles a config as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      const config = await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
        true,
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/games/config/${config.id}`)
        .set('Authorization', bearer(token))
        .send({ isEnabled: false })
        .expect(200);

      expect(res.body.data.isEnabled).toBe(false);
    });

    it('rejects a non-Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const config = await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
        true,
      );

      await request(app.getHttpServer())
        .patch(`/api/games/config/${config.id}`)
        .set('Authorization', bearer(token))
        .send({ isEnabled: false })
        .expect(403);
    });
  });

  describe('DELETE /api/games/config/:id', () => {
    it('deletes a config as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      const config = await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
      );

      await request(app.getHttpServer())
        .delete(`/api/games/config/${config.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/games/config')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });
  });
});
