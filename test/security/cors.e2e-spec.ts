import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp, EVIL_ORIGIN } from '../helpers/app.js';

const ALLOWED_ORIGIN = 'http://localhost:3000';

describe('VULN-06 CORS: only allowlisted origins', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('a foreign origin does not get Access-Control-Allow-Origin', async () => {
    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Origin', EVIL_ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('a preflight from a foreign origin is not allowed', async () => {
    const res = await request(app.getHttpServer())
      .options('/notes')
      .set('Origin', EVIL_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');
    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('never responds with a wildcard origin', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/search')
      .set('Origin', EVIL_ORIGIN);
    expect(res.headers['access-control-allow-origin']).not.toBe('*');
  });

  it('the allowlisted origin is allowed', async () => {
    const res = await request(app.getHttpServer())
      .get('/products/search')
      .set('Origin', ALLOWED_ORIGIN);
    expect(res.headers['access-control-allow-origin']).toBe(ALLOWED_ORIGIN);
  });
});
