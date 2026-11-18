import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../helpers/app.js';

describe('VULN-01 SQLi: product search', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('a normal search works', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/search')
      .query({ q: 'mouse' })
      .expect(200);
    expect(res.body).toHaveLength(1);
  });

  it("the payload ' OR 1=1 -- does not return every product", async () => {
    const res = await request(app.getHttpServer())
      .get('/products/search')
      .query({ q: "' OR 1=1 --" })
      .expect(200);
    expect(res.body).toHaveLength(0);
  });

  it('a single quote does not break the query', async () => {
    await request(app.getHttpServer())
      .get('/products/search')
      .query({ q: "'" })
      .expect(200);
  });

  it('a UNION payload does not leak user data', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/search')
      .query({
        q: '\' UNION SELECT id, email, "passwordHash", 0 FROM users --',
      });
    expect(res.status).toBe(200);
    expect(JSON.stringify(res.body)).not.toContain('@tpi.local');
  });
});
