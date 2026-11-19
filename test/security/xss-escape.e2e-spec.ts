import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { ALICE, createTestApp, login } from '../helpers/app.js';

const SCRIPT_PAYLOAD = '<script>alert(1)</script>';
const IMG_PAYLOAD = '<img src=x onerror=alert(1)>';

describe('XSS: user input is escaped in HTML views', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('VULN-03 reflected: the search term is escaped', async () => {
    const res = await request(app.getHttpServer())
      .get('/search')
      .query({ q: SCRIPT_PAYLOAD })
      .expect(200);
    expect(res.text).not.toContain(SCRIPT_PAYLOAD);
    expect(res.text).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('VULN-04 stored: comments are escaped when rendered', async () => {
    const cookie = await login(app, ALICE);
    await request(app.getHttpServer())
      .post('/products/1/comments')
      .set('Cookie', cookie)
      .type('form')
      .send({ body: IMG_PAYLOAD })
      .expect(303);

    const res = await request(app.getHttpServer())
      .get('/products/1')
      .expect(200);
    expect(res.text).not.toContain(IMG_PAYLOAD);
    expect(res.text).toContain('&lt;img');
  });
});
