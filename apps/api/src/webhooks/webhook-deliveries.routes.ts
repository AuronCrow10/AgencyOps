import { Router } from 'express';
import { WebhooksController } from './webhooks.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const webhooksController = new WebhooksController();

export const webhookDeliveriesRouter = Router();

webhookDeliveriesRouter.get('/', asyncHandler(webhooksController.listDeliveries));
