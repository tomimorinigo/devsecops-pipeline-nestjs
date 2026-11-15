import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { createTestApp } from '../helpers/app.js';

describe('VULN-05 security headers and CSP', () => {
  let app: NestExpressApplication;
  let res: request.Response;

  beforeAll(async () => {
    app = await createTestApp();
    res = await request(app.getHttpServer()).get('/').expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('sends a Content-Security-Policy header', () => {
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it.each([
    "default-src 'self'",
    "script-src 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
  ])('the CSP includes %s', (directive) => {
    expect(res.headers['content-security-policy']).toContain(directive);
  });

  it('the CSP does not allow unsafe-inline or unsafe-eval scripts', () => {
    const csp = res.headers['content-security-policy'] ?? '';
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).not.toContain('unsafe-eval');
  });

  it('sends X-Content-Type-Options: nosniff', () => {
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('does not reveal the framework with X-Powered-By', () => {
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
