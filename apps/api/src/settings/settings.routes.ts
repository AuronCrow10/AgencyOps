import { Router } from 'express';
import { SettingsController } from './settings.controller.js';
import { asyncHandler } from '../utils/async-handler.js';
import { requireRole } from '../middleware/authz.js';

const settingsController = new SettingsController();

export const settingsRouter = Router();

settingsRouter.get('/', asyncHandler(settingsController.get));
settingsRouter.patch('/', requireRole(['owner', 'admin']), asyncHandler(settingsController.update));
