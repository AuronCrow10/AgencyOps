import type { NextFunction, Request, Response } from 'express';
import type { AnyZodObject, ZodType } from 'zod';
import { ZodError } from 'zod';
import { AppError } from '../utils/app-error.js';

type ValidationSource = 'body' | 'query' | 'params';

export function validate(schema: ZodType, source: ValidationSource = 'body') {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const sourceValue: unknown =
        source === 'body' ? request.body : source === 'query' ? request.query : request.params;
      const result: unknown = schema.parse(sourceValue);
      if (source === 'body') {
        request.body = result as never;
      } else if (source === 'query') {
        request.query = result as never;
      } else {
        request.params = result as never;
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation failed', 400, 'validation_error', error.flatten()));
        return;
      }

      next(error);
    }
  };
}

export function validateComposite(schema: AnyZodObject) {
  return (request: Request, _response: Response, next: NextFunction) => {
    try {
      const result = schema.parse({
        body: request.body as unknown,
        query: request.query as unknown,
        params: request.params as unknown
      });
      request.body = result.body as never;
      request.query = result.query as never;
      request.params = result.params as never;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new AppError('Validation failed', 400, 'validation_error', error.flatten()));
        return;
      }

      next(error);
    }
  };
}
