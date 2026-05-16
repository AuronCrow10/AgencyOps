import crypto from 'node:crypto';
import type { RequestHandler } from 'express';

export const requestIdMiddleware: RequestHandler = (request, response, next) => {
  const incoming = request.header('x-request-id');
  const requestId = incoming?.trim() || crypto.randomUUID();
  request.requestId = requestId;
  response.setHeader('x-request-id', requestId);
  next();
};
