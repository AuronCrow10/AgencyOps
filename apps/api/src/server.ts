import { createServer } from 'node:http';
import { env } from './config/env.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';
import { prisma } from './db/prisma.js';
import { redisConnection } from './jobs/queue.js';

const app = createApp();
const server = createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'AgencyOps API listening');
});

function shutdown(signal: string) {
  logger.info({ signal }, 'Shutting down');
  server.close(async () => {
    await prisma.$disconnect();
    await redisConnection.quit();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
