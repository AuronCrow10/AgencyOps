import express from 'express';
import { pinoHttp } from 'pino-http';
import { prisma } from './db/prisma.js';
import { redisConnection } from './jobs/queue.js';
import { requestIdMiddleware } from './middleware/request-id.js';
import { applySecurityMiddleware } from './middleware/security.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';
import { logger } from './utils/logger.js';
import { authRouter } from './auth/auth.routes.js';
import { authRequired } from './auth/auth.middleware.js';
import { leadsRouter, publicLeadsRouter } from './leads/leads.routes.js';
import { tasksRouter } from './tasks/tasks.routes.js';
import { webhooksRouter } from './webhooks/webhooks.routes.js';
import { webhookDeliveriesRouter } from './webhooks/webhook-deliveries.routes.js';
import { settingsRouter } from './settings/settings.routes.js';
import { auditRouter } from './audit/audit.routes.js';
import { apiKeysRouter } from './api-keys/api-keys.routes.js';
import { usersRouter } from './users/users.routes.js';

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);

  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      customProps: (request: { requestId?: string }) => ({
        requestId: (request as typeof request & { requestId?: string }).requestId
      })
    })
  );
  applySecurityMiddleware(app);

  app.get('/api/health', async (_request, response, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      await redisConnection.ping();
      response.json({
        status: 'ok',
        db: 'ok',
        redis: 'ok',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  });

  app.get('/api/ready', async (_request, response, next) => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      response.json({ status: 'ready', timestamp: new Date().toISOString() });
    } catch (error) {
      next(error);
    }
  });

  app.use('/api/auth', authRouter);
  app.use('/api/public/leads', publicLeadsRouter);

  app.use('/api/leads', authRequired, leadsRouter);
  app.use('/api/tasks', authRequired, tasksRouter);
  app.use('/api/webhooks', authRequired, webhooksRouter);
  app.use('/api/webhook-deliveries', authRequired, webhookDeliveriesRouter);
  app.use('/api/settings', authRequired, settingsRouter);
  app.use('/api/audit-logs', authRequired, auditRouter);
  app.use('/api/api-keys', authRequired, apiKeysRouter);
  app.use('/api/users', authRequired, usersRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
