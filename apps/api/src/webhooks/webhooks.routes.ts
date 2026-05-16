import { Router } from 'express';
import { WebhooksController } from './webhooks.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireRole } from '../middleware/authz.js';
import { webhookTestRateLimit } from '../middleware/rate-limit.js';

const webhooksController = new WebhooksController();

export const webhooksRouter = Router();

webhooksRouter.get('/', asyncHandler(webhooksController.listEndpoints));
webhooksRouter.post('/', requireRole(['owner', 'admin']), asyncHandler(webhooksController.createEndpoint));
webhooksRouter.patch(
  '/:id',
  requireRole(['owner', 'admin']),
  asyncHandler(webhooksController.updateEndpoint)
);
webhooksRouter.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  asyncHandler(webhooksController.deleteEndpoint)
);
webhooksRouter.post(
  '/:id/test',
  requireRole(['owner', 'admin']),
  webhookTestRateLimit,
  asyncHandler(webhooksController.testEndpoint)
);
