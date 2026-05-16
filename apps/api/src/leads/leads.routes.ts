import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { publicLeadRateLimit } from '../middleware/rate-limit.js';
import { LeadsController } from './leads.controller.js';

const leadsController = new LeadsController();

export const leadsRouter = Router();
export const publicLeadsRouter = Router();

publicLeadsRouter.post('/', publicLeadRateLimit, asyncHandler(leadsController.createPublic));

leadsRouter.get('/dashboard', asyncHandler(leadsController.dashboard));
leadsRouter.get('/', asyncHandler(leadsController.list));
leadsRouter.get('/:id', asyncHandler(leadsController.getById));
leadsRouter.patch('/:id/status', asyncHandler(leadsController.updateStatus));
leadsRouter.post('/:id/rerun-analysis', asyncHandler(leadsController.rerunAnalysis));
