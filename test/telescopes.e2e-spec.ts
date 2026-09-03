import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { seedTelescope } from './utils/fixtures.util';
import { Role } from '../src/common/enum/roles.enum';
import {
  TelescopeLocation,
  TelescopeSpectrum,
} from '../src/common/enum/telecope.enum';
import { AmateurOwner } from '../src/amateur-owner/amateur-owner.entity';
import { SpaceOrganisation } from '../src/spaceOrganisations/space-organisations.entity';
import { Country } from '../src/common/enum/country.enum';

describe('Telescopes (e2e)', () => {
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

  describe('GET /api/telescopes', () => {
    it('is public and returns the list', async () => {
      await seedTelescope(dataSource);

      const res = await request(app.getHttpServer())
        .get('/api/telescopes')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
    });

    it('masks the amateur owner name when consent was not given', async () => {
      const owner = await dataSource.getRepository(AmateurOwner).save({
        firstName: 'Jane',
        lastName: 'Doe',
        consentToDisplayName: false,
      });
      await seedTelescope(dataSource, { isAmateur: true, amateurOwner: owner });

      const res = await request(app.getHttpServer())
        .get('/api/telescopes')
        .expect(200);

      expect(res.body.data[0].amateurOwner.firstName).toBeUndefined();
    });

    it('shows the amateur owner name when consent was given', async () => {
      const owner = await dataSource.getRepository(AmateurOwner).save({
        firstName: 'Jane',
        lastName: 'Doe',
        consentToDisplayName: true,
      });
      await seedTelescope(dataSource, { isAmateur: true, amateurOwner: owner });

      const res = await request(app.getHttpServer())
        .get('/api/telescopes')
        .expect(200);

      expect(res.body.data[0].amateurOwner.firstName).toBe('Jane');
    });
  });

  describe('GET /api/telescopes/:id', () => {
    it('returns 404 for an unknown id', async () => {
      await request(app.getHttpServer())
        .get('/api/telescopes/999999')
        .expect(404);
    });
  });

  describe('POST /api/telescopes', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Hubble')
        .field('telescopeLocation', TelescopeLocation.Space)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .expect(403);
    });

    it('creates a professional telescope linked to a space organisation', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const org = await dataSource.getRepository(SpaceOrganisation).save({
        name: 'NASA',
        description: 'desc',
        countries: [Country.UnitedStates],
      });

      const res = await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Hubble')
        .field('telescopeLocation', TelescopeLocation.Space)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .field('spaceOrganisationIds', String(org.id))
        .expect(201);

      expect(res.body.data.name).toBe('Hubble');
      expect(res.body.data.spaceOrganisations).toHaveLength(1);
    });

    it('creates an amateur telescope linked to an amateur owner', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await dataSource.getRepository(AmateurOwner).save({
        firstName: 'Jane',
        lastName: 'Doe',
        consentToDisplayName: true,
      });

      const res = await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Backyard scope')
        .field('telescopeLocation', TelescopeLocation.Ground)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .field('isAmateur', 'true')
        .field('amateurOwnerId', String(owner.id))
        .expect(201);

      expect(res.body.data.isAmateur).toBe(true);
    });

    it('rejects an amateur telescope linked to a space organisation', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const org = await dataSource.getRepository(SpaceOrganisation).save({
        name: 'NASA',
        description: 'desc',
        countries: [Country.UnitedStates],
      });

      await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Backyard scope')
        .field('telescopeLocation', TelescopeLocation.Ground)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .field('isAmateur', 'true')
        .field('spaceOrganisationIds', String(org.id))
        .expect(400);
    });

    it('rejects a professional telescope with an amateur owner', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await dataSource.getRepository(AmateurOwner).save({
        firstName: 'Jane',
        lastName: 'Doe',
        consentToDisplayName: true,
      });

      await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Pro scope')
        .field('telescopeLocation', TelescopeLocation.Ground)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .field('amateurOwnerId', String(owner.id))
        .expect(400);
    });

    it('rejects an unknown amateurOwnerId', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Backyard scope')
        .field('telescopeLocation', TelescopeLocation.Ground)
        .field('telescopeSpectrum', TelescopeSpectrum.Optical)
        .field('isAmateur', 'true')
        .field('amateurOwnerId', '999999')
        .expect(400);
    });

    it('rejects an invalid telescopeSpectrum', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/telescopes')
        .set('Authorization', bearer(token))
        .field('name', 'Hubble')
        .field('telescopeLocation', TelescopeLocation.Space)
        .field('telescopeSpectrum', 'NotASpectrum')
        .expect(400);
    });
  });

  describe('PATCH /api/telescopes/:id', () => {
    it('updates a telescope', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const telescope = await seedTelescope(dataSource, { name: 'Old name' });

      const res = await request(app.getHttpServer())
        .patch(`/api/telescopes/${telescope.id}`)
        .set('Authorization', bearer(token))
        .field('name', 'New name')
        .expect(200);

      expect(res.body.data.name).toBe('New name');
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .patch('/api/telescopes/999999')
        .set('Authorization', bearer(token))
        .field('name', 'Ghost')
        .expect(404);
    });
  });

  describe('DELETE /api/telescopes/:id', () => {
    it('deletes a telescope', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const telescope = await seedTelescope(dataSource);

      await request(app.getHttpServer())
        .delete(`/api/telescopes/${telescope.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/telescopes/${telescope.id}`)
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .delete('/api/telescopes/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
