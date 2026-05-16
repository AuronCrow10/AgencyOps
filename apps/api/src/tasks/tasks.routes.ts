import { Router } from 'express';
import { TasksController } from './tasks.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const tasksController = new TasksController();

export const tasksRouter = Router();

tasksRouter.get('/', asyncHandler(tasksController.list));
tasksRouter.post('/', asyncHandler(tasksController.create));
tasksRouter.patch('/:id', asyncHandler(tasksController.update));
