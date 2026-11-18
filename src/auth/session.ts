import type { CookieOptions, Request } from 'express';

export const SESSION_COOKIE = 'session';
export const SESSION_TTL_SECONDS = 15 * 60;

// VULN-10: session cookie readable from JavaScript and sent on cross-site requests
export const SESSION_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: false,
  secure: true,
  sameSite: 'none',
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
