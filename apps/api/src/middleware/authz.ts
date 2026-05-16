import type { RequestHandler } from 'express';
import type { UserRole } from '@agencyops/shared';
import { AppError } from '../utils/app-error.js';

export function requireRole(roles: UserRole[]): RequestHandler {
  return (request, _response, next) => {
    if (!request.auth || !roles.includes(request.auth.role)) {
      next(new AppError('Forbidden', 403, 'forbidden'));
      return;
    }

    next();
  };
}
