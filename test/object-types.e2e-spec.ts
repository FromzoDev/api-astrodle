import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp } from './utils/test-app.util';
import { ObjectType } from '../src/common/enum/object-type.enum';

describe('ObjectTypes (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/object-types', () => {
    it('is public and returns every object type with a label and description', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/object-types')
        .expect(200);

      const values = Object.values(ObjectType);
      expect(res.body.data).toHaveLength(values.length);

      for (const entry of res.body.data) {
        expect(values).toContain(entry.value);
        expect(entry.label).toEqual(expect.any(String));
        expect(entry.description).toEqual(expect.any(String));
      }
    });
  });
});
