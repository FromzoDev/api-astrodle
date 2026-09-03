import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { pngBuffer, textBuffer } from './utils/file.util';
import { Role } from '../src/common/enum/roles.enum';
import { Country } from '../src/common/enum/country.enum';
import { SpaceOrganisation } from '../src/spaceOrganisations/space-organisations.entity';

describe('SpaceOrganisations (e2e)', () => {
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

  async function seedOrganisation(
    overrides: Partial<SpaceOrganisation> = {},
  ): Promise<SpaceOrganisation> {
    return dataSource.getRepository(SpaceOrganisation).save({
      name: 'ESA',
      description: 'European Space Agency',
      countries: [Country.France],
      ...overrides,
    });
  }

  describe('GET /api/space-organisations', () => {
    it('is public (no auth required)', async () => {
      await seedOrganisation();

      const res = await request(app.getHttpServer())
        .get('/api/space-organisations')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('filters by country', async () => {
      await seedOrganisation({
        name: 'NASA',
        countries: [Country.UnitedStates],
      });
      await seedOrganisation({ name: 'ESA', countries: [Country.France] });

      const res = await request(app.getHttpServer())
        .get('/api/space-organisations')
        .query({ country: Country.France })
        .expect(200);

      expect(
        res.body.data.every((o: any) => o.countries.includes(Country.France)),
      ).toBe(true);
    });
  });

  describe('GET /api/space-organisations/:id', () => {
    it('is public and returns the organisation', async () => {
      const org = await seedOrganisation();

      const res = await request(app.getHttpServer())
        .get(`/api/space-organisations/${org.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(org.id);
    });

    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/space-organisations/999999')
        .expect(404);
    });
  });

  describe('POST /api/space-organisations', () => {
    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .expect(401);
    });

    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .expect(403);
    });

    it('creates an organisation as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .expect(201);

      expect(res.body.data.name).toBe('SpaceX');
      expect(res.body.data.countries).toEqual([Country.France]);
    });

    it('rejects an empty countries array', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([]))
        .expect(400);
    });

    it('rejects an invalid country value', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify(['Narnia']))
        .expect(400);
    });

    it('rejects a missing name', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .expect(400);
    });

    it('rejects an unsupported logo file type', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .attach('file', textBuffer(), {
          filename: 'logo.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('accepts a valid logo upload', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/space-organisations')
        .set('Authorization', bearer(token))
        .field('name', 'SpaceX')
        .field('description', 'Private aerospace')
        .field('countries', JSON.stringify([Country.France]))
        .attach('file', pngBuffer(), {
          filename: 'logo.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(res.body.data.agencyLogo).toEqual(expect.any(String));
    });
  });

  describe('PUT /api/space-organisations/:id', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);
      const org = await seedOrganisation();

      await request(app.getHttpServer())
        .put(`/api/space-organisations/${org.id}`)
        .set('Authorization', bearer(token))
        .field('name', 'New name')
        .expect(403);
    });

    it('updates an organisation as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const org = await seedOrganisation({ name: 'Old name' });

      const res = await request(app.getHttpServer())
        .put(`/api/space-organisations/${org.id}`)
        .set('Authorization', bearer(token))
        .field('name', 'New name')
        .expect(200);

      expect(res.body.data.name).toBe('New name');
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .put('/api/space-organisations/999999')
        .set('Authorization', bearer(token))
        .field('name', 'Ghost')
        .expect(404);
    });
  });

  describe('DELETE /api/space-organisations/:id', () => {
    it('deletes an organisation as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const org = await seedOrganisation();

      await request(app.getHttpServer())
        .delete(`/api/space-organisations/${org.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/space-organisations/${org.id}`)
        .expect(404);
    });

    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);
      const org = await seedOrganisation();

      await request(app.getHttpServer())
        .delete(`/api/space-organisations/${org.id}`)
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .delete('/api/space-organisations/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
