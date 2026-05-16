import { Router } from 'express';
import { ApiKeysController } from './api-keys.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireRole } from '../middleware/authz.js';

const apiKeysController = new ApiKeysController();

export const apiKeysRouter = Router();

apiKeysRouter.get('/', requireRole(['owner', 'admin']), asyncHandler(apiKeysController.list));
apiKeysRouter.post('/', requireRole(['owner', 'admin']), asyncHandler(apiKeysController.create));
apiKeysRouter.delete(
  '/:id',
  requireRole(['owner', 'admin']),
  asyncHandler(apiKeysController.revoke)
);
