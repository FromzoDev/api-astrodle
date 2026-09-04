import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createAuthenticatedUser, bearer } from './utils/auth.util';
import { Role } from '../src/common/enum/roles.enum';
import { AmateurOwner } from '../src/amateur-owner/amateur-owner.entity';

describe('AmateurOwner (e2e)', () => {
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

  async function seedOwner(
    overrides: Partial<AmateurOwner> = {},
  ): Promise<AmateurOwner> {
    return dataSource.getRepository(AmateurOwner).save({
      firstName: 'Amateur',
      lastName: 'Owner',
      consentToDisplayName: false,
      ...overrides,
    });
  }

  describe('GET /api/amateur-owners', () => {
    it('rejects an unauthenticated request', async () => {
      await request(app.getHttpServer()).get('/api/amateur-owners').expect(401);
    });

    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns a paginated list for a Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      await seedOwner({ firstName: 'A' });
      await seedOwner({ firstName: 'B' });

      const res = await request(app.getHttpServer())
        .get('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.pagination.total).toBe(2);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('GET /api/amateur-owners/:id', () => {
    it('returns the requested owner', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await seedOwner();

      const res = await request(app.getHttpServer())
        .get(`/api/amateur-owners/${owner.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data.id).toBe(owner.id);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/amateur-owners/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });

  describe('POST /api/amateur-owners', () => {
    it('creates an amateur owner without a name (anonymous)', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .send({ consentToDisplayName: false })
        .expect(201);

      expect(res.body.data.consentToDisplayName).toBe(false);
    });

    it('creates an amateur owner with a name when consent is given', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      const res = await request(app.getHttpServer())
        .post('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .send({
          firstName: 'Jane',
          lastName: 'Doe',
          consentToDisplayName: true,
        })
        .expect(201);

      expect(res.body.data.firstName).toBe('Jane');
    });

    it('rejects consent given without a name', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .send({ consentToDisplayName: true })
        .expect(400);
    });

    it('rejects a missing consentToDisplayName field', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/amateur-owners')
        .set('Authorization', bearer(token))
        .send({ firstName: 'Jane' })
        .expect(400);
    });
  });

  describe('PATCH /api/amateur-owners/:id', () => {
    it('updates an owner', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await seedOwner({ firstName: 'Old' });

      const res = await request(app.getHttpServer())
        .patch(`/api/amateur-owners/${owner.id}`)
        .set('Authorization', bearer(token))
        .send({ firstName: 'New' })
        .expect(200);

      expect(res.body.data.firstName).toBe('New');
    });

    it('rejects enabling consent when no name is set and none is provided', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await seedOwner({
        firstName: undefined,
        lastName: undefined,
        consentToDisplayName: false,
      });

      await request(app.getHttpServer())
        .patch(`/api/amateur-owners/${owner.id}`)
        .set('Authorization', bearer(token))
        .send({ consentToDisplayName: true })
        .expect(400);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .patch('/api/amateur-owners/999999')
        .set('Authorization', bearer(token))
        .send({ firstName: 'Ghost' })
        .expect(404);
    });
  });

  describe('DELETE /api/amateur-owners/:id', () => {
    it('deletes an owner', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const owner = await seedOwner();

      await request(app.getHttpServer())
        .delete(`/api/amateur-owners/${owner.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/amateur-owners/${owner.id}`)
        .set('Authorization', bearer(token))
        .expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .delete('/api/amateur-owners/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
