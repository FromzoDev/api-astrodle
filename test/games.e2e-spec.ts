import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { seedGameConfig } from './utils/fixtures.util';
import { GameType } from '../src/common/enum/game-type.enum';
import { GameMode } from '../src/common/enum/game-mode.enum';

describe('Games (e2e)', () => {
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

  describe('GET /api/games/modes/:mode/available-games', () => {
    it('is public', async () => {
      await request(app.getHttpServer())
        .get('/api/games/modes/daily/available-games')
        .expect(200);
    });

    it('returns only games enabled for the requested mode', async () => {
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Daily,
        true,
      );
      await seedGameConfig(
        dataSource,
        GameType.GuessSkyObject,
        GameMode.Casual,
        false,
      );

      const dailyRes = await request(app.getHttpServer())
        .get('/api/games/modes/daily/available-games')
        .expect(200);
      expect(dailyRes.body.data).toContain(GameType.GuessSkyObject);

      const casualRes = await request(app.getHttpServer())
        .get('/api/games/modes/casual/available-games')
        .expect(200);
      expect(casualRes.body.data).not.toContain(GameType.GuessSkyObject);
    });

    it('returns an empty list when nothing is configured', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/games/modes/daily/available-games')
        .expect(200);

      expect(res.body.data).toEqual([]);
    });
  });
});
