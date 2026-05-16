import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';
import { logger } from '../utils/logger.js';

export const notFoundHandler: RequestHandler = (request, response) => {
  response.status(404).json({
    error: {
      code: 'not_found',
      message: `Route ${request.method} ${request.originalUrl} was not found`
    }
  });
};

export const errorHandler: ErrorRequestHandler = (error, request, response, _next) => {
  const appError =
    error instanceof AppError
      ? error
      : error instanceof ZodError
        ? new AppError('Validation failed', 400, 'validation_error', error.flatten())
      : new AppError('Internal server error', 500, 'internal_error');

  logger.error(
    {
      err: error,
      requestId: request.requestId,
      path: request.originalUrl,
      method: request.method
    },
    'Request failed'
  );

  response.status(appError.statusCode).json({
    error: {
      code: appError.code,
      message:
        appError.statusCode >= 500 && process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : appError.message,
      details: appError.statusCode < 500 ? appError.details : undefined,
      requestId: request.requestId
    }
  });
};
