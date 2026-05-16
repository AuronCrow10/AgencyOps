import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { asyncHandler } from '../utils/async-handler.js';

const usersController = new UsersController();

export const usersRouter = Router();

usersRouter.get('/', asyncHandler(usersController.list));
