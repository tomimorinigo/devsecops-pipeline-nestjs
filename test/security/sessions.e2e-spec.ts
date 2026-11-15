import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import {
  ALICE,
  createTestApp,
  getSessionSetCookie,
  login,
  seedPassword,
} from '../helpers/app.js';

describe('VULN-16 sessions: secure cookie and real logout', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('session cookie flags', () => {
    let setCookie: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: ALICE, password: seedPassword(app) })
        .expect(200);
      setCookie = getSessionSetCookie(res) ?? '';
    });

    it('is HttpOnly', () => {
      expect(setCookie).toMatch(/;\s*HttpOnly/i);
    });

    it('is Secure', () => {
      expect(setCookie).toMatch(/;\s*Secure/i);
    });

    it('is SameSite=Lax or Strict', () => {
      expect(setCookie).toMatch(/;\s*SameSite=(Lax|Strict)/i);
    });

    it('expires in 15 minutes or less', () => {
      const maxAge = Number(/Max-Age=(\d+)/i.exec(setCookie)?.[1]);
      expect(maxAge).toBeGreaterThan(0);
      expect(maxAge).toBeLessThanOrEqual(15 * 60);
    });
  });

  it('wrong credentials return 401 without a session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: ALICE, password: 'wrong-password' });
    expect(res.status).toBe(401);
    expect(getSessionSetCookie(res)).toBeUndefined();
  });

  it('a tampered token is rejected', async () => {
    const cookie = await login(app, ALICE);
    const tampered = cookie.slice(0, -4) + 'AAAA';
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', tampered)
      .expect(401);
  });

  it('after logout the old token no longer works', async () => {
    const cookie = await login(app, ALICE);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .expect(200);

    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Cookie', cookie)
      .expect(401);
  });
});
