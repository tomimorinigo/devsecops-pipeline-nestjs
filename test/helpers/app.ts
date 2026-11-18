import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/app.setup.js';

export const ALICE = 'alice@tpi.local';
export const BOB = 'bob@tpi.local';
export const EVIL_ORIGIN = 'https://evil.example';

export async function createTestApp(): Promise<NestExpressApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = configureApp(
    moduleRef.createNestApplication<NestExpressApplication>(),
  );
  await app.init();
  return app;
}

export function seedPassword(app: NestExpressApplication): string {
  return app.get(ConfigService).getOrThrow<string>('SEED_PASSWORD');
}

export function getSessionSetCookie(res: request.Response): string | undefined {
  const cookies = ([] as string[]).concat(res.get('Set-Cookie') ?? []);
  return cookies.find((cookie) => cookie.startsWith('session='));
}

export async function login(
  app: NestExpressApplication,
  email: string,
): Promise<string> {
  const res = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: seedPassword(app) })
    .expect(200);
  const setCookie = getSessionSetCookie(res);
  if (!setCookie) {
    throw new Error('Login did not set a session cookie');
  }
  return setCookie.split(';')[0];
}
