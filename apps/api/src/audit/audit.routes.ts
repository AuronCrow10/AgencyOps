import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const auditController = new AuditController();

export const auditRouter = Router();

auditRouter.get('/', asyncHandler(auditController.list));
