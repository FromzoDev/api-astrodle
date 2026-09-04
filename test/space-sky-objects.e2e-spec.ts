import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import {
  seedSpaceSkyObject,
  seedPersonality,
  seedTelescope,
} from './utils/fixtures.util';
import { Role } from '../src/common/enum/roles.enum';
import { ObjectType } from '../src/common/enum/object-type.enum';

describe('SpaceSkyObjects (e2e)', () => {
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

  describe('GET /api/space-sky-objects', () => {
    it('is public and returns the list', async () => {
      await seedSpaceSkyObject(dataSource);

      const res = await request(app.getHttpServer())
        .get('/api/space-sky-objects')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('filters by objectType', async () => {
      await seedSpaceSkyObject(dataSource, {
        objectType: ObjectType.Galaxy,
        name: 'GalaxyOne',
      });
      await seedSpaceSkyObject(dataSource, {
        objectType: ObjectType.Nebula,
        name: 'NebulaOne',
      });

      const res = await request(app.getHttpServer())
        .get('/api/space-sky-objects')
        .query({ objectType: ObjectType.Galaxy })
        .expect(200);

      expect(
        res.body.data.every((o: any) => o.objectType === ObjectType.Galaxy),
      ).toBe(true);
    });
  });

  describe('GET /api/space-sky-objects/:id', () => {
    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/space-sky-objects/999999')
        .expect(404);
    });

    it('returns the requested object', async () => {
      const obj = await seedSpaceSkyObject(dataSource);

      const res = await request(app.getHttpServer())
        .get(`/api/space-sky-objects/${obj.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(obj.id);
    });
  });

  describe('POST /api/space-sky-objects', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);
      const discoverer = await seedPersonality(dataSource);
      const telescope = await seedTelescope(dataSource);

      await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', '1610-11-26')
        .field('objectType', ObjectType.Nebula)
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', String(discoverer.id))
        .field('telescopeId', String(telescope.id))
        .expect(403);
    });

    it('creates an object as Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const discoverer = await seedPersonality(dataSource);
      const telescope = await seedTelescope(dataSource);

      const res = await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', '1610-11-26')
        .field('objectType', ObjectType.Nebula)
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', String(discoverer.id))
        .field('telescopeId', String(telescope.id))
        .expect(201);

      expect(res.body.data.name).toBe('Orion Nebula');
    });

    it('rejects an unknown discovererId', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const telescope = await seedTelescope(dataSource);

      await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', '1610-11-26')
        .field('objectType', ObjectType.Nebula)
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', '999999')
        .field('telescopeId', String(telescope.id))
        .expect(400);
    });

    it('rejects an unknown telescopeId', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const discoverer = await seedPersonality(dataSource);

      await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', '1610-11-26')
        .field('objectType', ObjectType.Nebula)
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', String(discoverer.id))
        .field('telescopeId', '999999')
        .expect(400);
    });

    it('rejects an invalid objectType', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const discoverer = await seedPersonality(dataSource);
      const telescope = await seedTelescope(dataSource);

      await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', '1610-11-26')
        .field('objectType', 'not-a-type')
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', String(discoverer.id))
        .field('telescopeId', String(telescope.id))
        .expect(400);
    });

    it('rejects an invalid discoveryDate', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const discoverer = await seedPersonality(dataSource);
      const telescope = await seedTelescope(dataSource);

      await request(app.getHttpServer())
        .post('/api/space-sky-objects')
        .set('Authorization', bearer(token))
        .field('name', 'Orion Nebula')
        .field('constellationName', 'Orion')
        .field('discoveryDate', 'not-a-date')
        .field('objectType', ObjectType.Nebula)
        .field('magnitude', '4')
        .field('distanceLightYears', '1344')
        .field('description', 'A nebula')
        .field('discovererId', String(discoverer.id))
        .field('telescopeId', String(telescope.id))
        .expect(400);
    });
  });

  describe('PATCH /api/space-sky-objects/:id', () => {
    it('updates an object', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const obj = await seedSpaceSkyObject(dataSource, { name: 'Old name' });

      const res = await request(app.getHttpServer())
        .patch(`/api/space-sky-objects/${obj.id}`)
        .set('Authorization', bearer(token))
        .field('name', 'New name')
        .expect(200);

      expect(res.body.data.name).toBe('New name');
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .patch('/api/space-sky-objects/999999')
        .set('Authorization', bearer(token))
        .field('name', 'Ghost')
        .expect(404);
    });
  });

  describe('DELETE /api/space-sky-objects/:id', () => {
    it('deletes an object', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const obj = await seedSpaceSkyObject(dataSource);

      await request(app.getHttpServer())
        .delete(`/api/space-sky-objects/${obj.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/space-sky-objects/${obj.id}`)
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .delete('/api/space-sky-objects/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
