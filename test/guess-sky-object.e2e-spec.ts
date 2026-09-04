import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import {
  seedSpaceSkyObject,
  seedGuessSkyObjectGame,
  seedGameConfig,
} from './utils/fixtures.util';
import { Role } from '../src/common/enum/roles.enum';
import { GameType } from '../src/common/enum/game-type.enum';
import { GameMode } from '../src/common/enum/game-mode.enum';

describe('GuessSkyObject (e2e)', () => {
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

  describe('POST /api/guess-sky-object/daily/start', () => {
    it('is forbidden when the daily mode is not enabled', async () => {
      await request(app.getHttpServer())
        .post('/api/guess-sky-object/daily/start')
        .expect(403);
    });

    it('starts a game when enabled', async () => {
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
        true,
      );
      const spaceSkyObject = await seedSpaceSkyObject(dataSource, {
        name: 'Andromeda',
      });
      await seedGuessSkyObjectGame(dataSource, {
        spaceSkyObject,
        isEnabled: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/guess-sky-object/daily/start')
        .expect(201);

      expect(res.body.data.sessionId).toEqual(expect.any(String));
      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.partialName).not.toContain('Andromeda');
      expect(res.body.data.fullName).toBeUndefined();
    });
  });

  describe('POST /api/guess-sky-object/casual/start', () => {
    it('is forbidden when the casual mode is not enabled', async () => {
      await request(app.getHttpServer())
        .post('/api/guess-sky-object/casual/start')
        .expect(403);
    });

    it('starts a game when enabled', async () => {
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Casual,
        true,
      );
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);
      await seedGuessSkyObjectGame(dataSource, {
        spaceSkyObject,
        isEnabled: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/guess-sky-object/casual/start')
        .expect(201);

      expect(res.body.data.sessionId).toEqual(expect.any(String));
    });
  });

  describe('POST /api/guess-sky-object/:sessionId/guess', () => {
    async function startCasualGame(objectName: string) {
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Casual,
        true,
      );
      const spaceSkyObject = await seedSpaceSkyObject(dataSource, {
        name: objectName,
      });
      await seedGuessSkyObjectGame(dataSource, {
        spaceSkyObject,
        isEnabled: true,
      });

      const startRes = await request(app.getHttpServer())
        .post('/api/guess-sky-object/casual/start')
        .expect(201);
      return startRes.body.data.sessionId as string;
    }

    it('marks the session as won on a correct guess', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      const res = await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'Andromeda Galaxy' })
        .expect(201);

      expect(res.body.data.status).toBe('won');
      expect(res.body.data.fullName).toBe('Andromeda Galaxy');
    });

    it('is case-insensitive', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      const res = await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'ANDROMEDA galaxy' })
        .expect(201);

      expect(res.body.data.status).toBe('won');
    });

    it('is accent-insensitive', async () => {
      const sessionId = await startCasualGame('Nébuleuse');

      const res = await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'Nebuleuse' })
        .expect(201);

      expect(res.body.data.status).toBe('won');
    });

    it('keeps the session in progress on a wrong guess and reveals a hint', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      const res = await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'Definitely Not The Answer' })
        .expect(201);

      expect(res.body.data.status).toBe('in_progress');
      expect(res.body.data.attemptsUsed).toBe(1);
      expect(res.body.data.fullName).toBeUndefined();
    });

    it('rejects an empty guess', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: '' })
        .expect(400);
    });

    it('returns 404 for an unknown session', async () => {
      await request(app.getHttpServer())
        .post(
          '/api/guess-sky-object/00000000-0000-0000-0000-000000000000/guess',
        )
        .send({ guess: 'anything' })
        .expect(404);
    });

    it('rejects further guesses once the session is finished', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'Andromeda Galaxy' })
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/guess-sky-object/${sessionId}/guess`)
        .send({ guess: 'Andromeda Galaxy' })
        .expect(400);
    });

    it('marks the session as lost after exhausting every attempt', async () => {
      const sessionId = await startCasualGame('Andromeda Galaxy');

      let lastRes;
      for (let i = 0; i < 10; i++) {
        lastRes = await request(app.getHttpServer())
          .post(`/api/guess-sky-object/${sessionId}/guess`)
          .send({ guess: 'Wrong Answer' })
          .expect(201);
      }

      expect(lastRes.body.data.status).toBe('lost');
    });
  });

  describe('GET /api/guess-sky-object/stats', () => {
    it('returns global stats for a mode', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/guess-sky-object/stats')
        .query({ mode: GameMode.Casual })
        .expect(200);

      expect(res.body.data.totalPlayed).toBe(0);
    });
  });

  describe('GET /api/guess-sky-object/:spaceSkyObjectId/stats', () => {
    it('returns the stats entry for a tracked object', async () => {
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);
      await seedGuessSkyObjectGame(dataSource, {
        spaceSkyObject,
        isEnabled: true,
      });

      const res = await request(app.getHttpServer())
        .get(`/api/guess-sky-object/${spaceSkyObject.id}/stats`)
        .expect(200);

      expect(res.body.data).not.toBeNull();
    });

    it('returns null data for an object with no game entry', async () => {
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);

      const res = await request(app.getHttpServer())
        .get(`/api/guess-sky-object/${spaceSkyObject.id}/stats`)
        .expect(200);

      expect(res.body.data).toBeNull();
    });
  });

  describe('GET /api/guess-sky-object/games', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/guess-sky-object/games')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns a paginated list for a Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      await seedGuessSkyObjectGame(dataSource);

      const res = await request(app.getHttpServer())
        .get('/api/guess-sky-object/games')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('POST /api/guess-sky-object/games', () => {
    it('enables an object for the game as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);

      const res = await request(app.getHttpServer())
        .post('/api/guess-sky-object/games')
        .set('Authorization', bearer(token))
        .send({ spaceSkyObjectId: spaceSkyObject.id })
        .expect(201);

      expect(res.body.data.isEnabled).toBe(true);
    });

    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);

      await request(app.getHttpServer())
        .post('/api/guess-sky-object/games')
        .set('Authorization', bearer(token))
        .send({ spaceSkyObjectId: spaceSkyObject.id })
        .expect(403);
    });
  });

  describe('PATCH /api/guess-sky-object/games/:id', () => {
    it('toggles a game as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const game = await seedGuessSkyObjectGame(dataSource, {
        isEnabled: true,
      });

      await request(app.getHttpServer())
        .patch(`/api/guess-sky-object/games/${game.id}`)
        .set('Authorization', bearer(token))
        .send({ isEnabled: false })
        .expect(200);

      const res = await request(app.getHttpServer())
        .get('/api/guess-sky-object/games')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data[0].isEnabled).toBe(false);
    });
  });

  describe('GET /api/guess-sky-object/daily-schedule', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/guess-sky-object/daily-schedule')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns the schedule history for a Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
        true,
      );
      const spaceSkyObject = await seedSpaceSkyObject(dataSource);
      await seedGuessSkyObjectGame(dataSource, {
        spaceSkyObject,
        isEnabled: true,
      });

      // Triggers the daily schedule to be planned for today.
      await request(app.getHttpServer())
        .post('/api/guess-sky-object/daily/start')
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/guess-sky-object/daily-schedule')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });
  });
});
