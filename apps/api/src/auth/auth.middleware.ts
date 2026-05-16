import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { accessCookieName, verifyAccessToken } from './session.js';
import { AppError } from '../utils/app-error.js';

const { JsonWebTokenError, TokenExpiredError } = jwt;

export const authRequired: RequestHandler = (request, _response, next) => {
  const signedCookies = request.signedCookies as Record<string, string | undefined> | undefined;
  const token = signedCookies?.[accessCookieName];

  if (!token) {
    next(new AppError('Authentication required', 401, 'unauthorized'));
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    request.auth = payload;
    next();
  } catch (error) {
    if (error instanceof JsonWebTokenError || error instanceof TokenExpiredError) {
      next(new AppError('Session expired or invalid', 401, 'unauthorized'));
      return;
    }

    next(error);
  }
};
