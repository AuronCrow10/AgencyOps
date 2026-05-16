import type { Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export const accessCookieName = 'agencyops_access';
export const refreshCookieName = 'agencyops_refresh';

export type AccessTokenPayload = {
  userId: string;
  organizationId: string;
  role: 'owner' | 'admin' | 'operator';
};

export type RefreshTokenPayload = AccessTokenPayload & {
  sessionId: string;
};

const baseCookieOptions = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax' as const,
  signed: true,
  path: '/'
};

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.accessTokenTtlMinutes}m`,
    issuer: 'agencyops'
  });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    algorithm: 'HS256',
    expiresIn: `${env.refreshTokenTtlDays}d`,
    issuer: 'agencyops'
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, { issuer: 'agencyops' }) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, { issuer: 'agencyops' }) as RefreshTokenPayload;
}

export function setAuthCookies(
  response: Response,
  payload: AccessTokenPayload,
  refreshPayload: RefreshTokenPayload
) {
  response.cookie(accessCookieName, signAccessToken(payload), {
    ...baseCookieOptions,
    maxAge: env.accessTokenTtlMinutes * 60 * 1000
  });
  response.cookie(refreshCookieName, signRefreshToken(refreshPayload), {
    ...baseCookieOptions,
    maxAge: env.refreshTokenTtlDays * 24 * 60 * 60 * 1000
  });
}

export function clearAuthCookies(response: Response) {
  response.clearCookie(accessCookieName, baseCookieOptions);
  response.clearCookie(refreshCookieName, baseCookieOptions);
}
