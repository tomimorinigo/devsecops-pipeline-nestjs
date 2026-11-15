import type { CookieOptions, Request } from 'express';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 15 * 60;

// FIX-16: session cookie not readable from JS, only over HTTPS, not sent cross-site
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax',
  path: '/',
  maxAge: SESSION_TTL_SECONDS * 1000,
};

export interface SessionUser {
  id: number;
  email: string;
}

export interface AuthenticatedRequest extends Request {
  user: SessionUser;
}

export interface SessionPayload {
  sub: number;
  email: string;
  jti: string;
  exp: number;
}
