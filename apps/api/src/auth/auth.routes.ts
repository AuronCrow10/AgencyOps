import { Router } from 'express';
import { asyncHandler } from '../utils/async-handler.js';
import { authRateLimit } from '../middleware/rate-limit.js';
import { authRequired } from './auth.middleware.js';
import { AuthController } from './auth.controller.js';

const authController = new AuthController();

export const authRouter = Router();

authRouter.post('/register', authRateLimit, asyncHandler(authController.register));
authRouter.post('/login', authRateLimit, asyncHandler(authController.login));
authRouter.post('/refresh', authRateLimit, asyncHandler(authController.refresh));
authRouter.post('/logout', authRequired, asyncHandler(authController.logout));
authRouter.get('/me', authRequired, asyncHandler(authController.me));
