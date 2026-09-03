import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { seedPersonality } from './utils/fixtures.util';
import { pngBuffer } from './utils/file.util';
import { Role } from '../src/common/enum/roles.enum';
import { Country } from '../src/common/enum/country.enum';
import { Profession } from '../src/common/enum/profession.enum';

describe('Personalities (e2e)', () => {
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

  describe('GET /api/personalities', () => {
    it('is public and returns the list', async () => {
      await seedPersonality(dataSource);

      const res = await request(app.getHttpServer())
        .get('/api/personalities')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('filters by profession', async () => {
      await seedPersonality(dataSource, {
        profession: Profession.Engineer,
        lastName: 'Eng1',
      });
      await seedPersonality(dataSource, {
        profession: Profession.Astronomer,
        lastName: 'Astro1',
      });

      const res = await request(app.getHttpServer())
        .get('/api/personalities')
        .query({ profession: Profession.Engineer })
        .expect(200);

      expect(
        res.body.data.every((p: any) => p.profession === Profession.Engineer),
      ).toBe(true);
    });
  });

  describe('GET /api/personalities/:id', () => {
    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/personalities/999999')
        .expect(404);
    });

    it('returns the requested personality', async () => {
      const personality = await seedPersonality(dataSource);

      const res = await request(app.getHttpServer())
        .get(`/api/personalities/${personality.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(personality.id);
    });
  });

  describe('POST /api/personalities', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', '1867-11-07')
        .field('nationality', Country.Poland)
        .field('profession', Profession.Physicist)
        .field('description', 'Physicist and chemist')
        .expect(403);
    });

    it('creates a personality as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', '1867-11-07')
        .field('nationality', Country.Poland)
        .field('profession', Profession.Physicist)
        .field('description', 'Physicist and chemist')
        .expect(201);

      expect(res.body.data.firstName).toBe('Marie');
    });

    it('accepts an optional dateOfDeath', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', '1867-11-07')
        .field('dateOfDeath', '1934-07-04')
        .field('nationality', Country.Poland)
        .field('profession', Profession.Physicist)
        .field('description', 'Physicist and chemist')
        .expect(201);

      expect(res.body.data.dateOfDeath).toBeTruthy();
    });

    it('rejects an invalid dateOfBirth', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', 'not-a-date')
        .field('nationality', Country.Poland)
        .field('profession', Profession.Physicist)
        .field('description', 'Physicist and chemist')
        .expect(400);
    });

    it('rejects an invalid profession', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', '1867-11-07')
        .field('nationality', Country.Poland)
        .field('profession', 'not-a-profession')
        .field('description', 'Physicist and chemist')
        .expect(400);
    });

    it('accepts a valid photo upload', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/personalities')
        .set('Authorization', bearer(token))
        .field('firstName', 'Marie')
        .field('lastName', 'Curie')
        .field('dateOfBirth', '1867-11-07')
        .field('nationality', Country.Poland)
        .field('profession', Profession.Physicist)
        .field('description', 'Physicist and chemist')
        .attach('file', pngBuffer(), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(res.body.data.personalityImage).toEqual(expect.any(String));
    });
  });

  describe('PATCH /api/personalities/:id', () => {
    it('updates a personality', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const personality = await seedPersonality(dataSource, {
        firstName: 'Old',
      });

      const res = await request(app.getHttpServer())
        .patch(`/api/personalities/${personality.id}`)
        .set('Authorization', bearer(token))
        .field('firstName', 'New')
        .expect(200);

      expect(res.body.data.firstName).toBe('New');
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .patch('/api/personalities/999999')
        .set('Authorization', bearer(token))
        .field('firstName', 'Ghost')
        .expect(404);
    });
  });

  describe('DELETE /api/personalities/:id', () => {
    it('deletes a personality', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const personality = await seedPersonality(dataSource);

      await request(app.getHttpServer())
        .delete(`/api/personalities/${personality.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/personalities/${personality.id}`)
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .delete('/api/personalities/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
