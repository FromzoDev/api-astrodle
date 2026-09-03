import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';
import { createTestApp } from './utils/test-app.util';
import { clearDatabase } from './utils/db.util';
import { createUser, createAuthenticatedUser, bearer } from './utils/auth.util';
import { pngBuffer, textBuffer } from './utils/file.util';
import { Role } from '../src/common/enum/roles.enum';

describe('Users (e2e)', () => {
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

  describe('GET /api/users', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns only the authenticating user when no other user exists', async () => {
      const { token, user } = await createAuthenticatedUser(app, [
        Role.Moderator,
      ]);

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(user.id);
    });

    it('returns a paginated list of users', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      await createUser(app, { email: 'a@test.com', username: 'a_user' });
      await createUser(app, { email: 'b@test.com', username: 'b_user' });

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .query({ page: 1, limit: 10 })
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.pagination.total).toBeGreaterThanOrEqual(3); // 2 seeded + the moderator itself
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('filters by role', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      await createUser(app, {
        email: 'admin1@test.com',
        username: 'admin1',
        roles: [Role.Admin],
      });

      const res = await request(app.getHttpServer())
        .get('/api/users')
        .query({ role: Role.Admin })
        .set('Authorization', bearer(token))
        .expect(200);

      expect(
        res.body.data.every((u: any) => u.roles.includes(Role.Admin)),
      ).toBe(true);
    });
  });

  describe('GET /api/users/profile', () => {
    it('returns the profile of the authenticated user', async () => {
      const { token, user } = await createAuthenticatedUser(app, [Role.User], {
        email: 'me@test.com',
      });

      const res = await request(app.getHttpServer())
        .get('/api/users/profile')
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data.id).toBe(user.id);
      expect(res.body.data.email).toBe('me@test.com');
    });
  });

  describe('GET /api/users/:id', () => {
    it('rejects a non-Moderator', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.User]);

      await request(app.getHttpServer())
        .get('/api/users/1')
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('returns the requested user', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const target = await createUser(app, { email: 'target@test.com' });

      const res = await request(app.getHttpServer())
        .get(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      expect(res.body.data.id).toBe(target.id);
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .get('/api/users/999999')
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('rejects a non-Admin (Moderator included)', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('email', 'new@test.com')
        .field('username', 'new_user')
        .field('firstName', 'New')
        .field('lastName', 'User')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .expect(403);
    });

    it('creates a user as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('email', 'created@test.com')
        .field('username', 'created_user')
        .field('firstName', 'Created')
        .field('lastName', 'User')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .expect(201);

      expect(res.body.data.email).toBe('created@test.com');
      expect(res.body.data.password).toBeUndefined();
    });

    it('rejects a duplicate email/username', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      await createUser(app, { email: 'dupe@test.com', username: 'dupe_user' });

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('email', 'dupe@test.com')
        .field('username', 'someone_else')
        .field('firstName', 'Dup')
        .field('lastName', 'User')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .expect(409);
    });

    it('rejects a missing required field', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('username', 'incomplete_user')
        .field('firstName', 'Incomplete')
        .field('lastName', 'User')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .expect(400);
    });

    it('rejects an unsupported file type for the avatar', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('email', 'badfile@test.com')
        .field('username', 'badfile_user')
        .field('firstName', 'Bad')
        .field('lastName', 'File')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .attach('file', textBuffer(), {
          filename: 'note.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('accepts a valid avatar upload', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      const res = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', bearer(token))
        .field('email', 'withavatar@test.com')
        .field('username', 'withavatar_user')
        .field('firstName', 'With')
        .field('lastName', 'Avatar')
        .field('password', 'Password123!')
        .field('roles', Role.User)
        .attach('file', pngBuffer(), {
          filename: 'avatar.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(res.body.data.profilePicture).toEqual(expect.any(String));
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('rejects a non-Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const target = await createUser(app, { email: 'patchtarget@test.com' });

      await request(app.getHttpServer())
        .patch(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .field('firstName', 'Changed')
        .expect(403);
    });

    it('updates a user as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      const target = await createUser(app, { email: 'patchme@test.com' });

      const res = await request(app.getHttpServer())
        .patch(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .field('firstName', 'Changed')
        .expect(200);

      expect(res.body.data.firstName).toBe('Changed');
    });

    it('returns 404 for an unknown id', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);

      await request(app.getHttpServer())
        .patch('/api/users/999999')
        .set('Authorization', bearer(token))
        .field('firstName', 'Changed')
        .expect(404);
    });

    it('rejects a username already taken by another user', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      await createUser(app, { username: 'taken_username' });
      const target = await createUser(app, { email: 'wantsusername@test.com' });

      await request(app.getHttpServer())
        .patch(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .field('username', 'taken_username')
        .expect(409);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('rejects a non-Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Moderator]);
      const target = await createUser(app, { email: 'deltarget@test.com' });

      await request(app.getHttpServer())
        .delete(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .expect(403);
    });

    it('deletes a user as Admin', async () => {
      const { token } = await createAuthenticatedUser(app, [Role.Admin]);
      const target = await createUser(app, { email: 'todelete@test.com' });

      await request(app.getHttpServer())
        .delete(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .expect(200);

      await request(app.getHttpServer())
        .get(`/api/users/${target.id}`)
        .set('Authorization', bearer(token))
        .expect(404);
    });
  });
});
