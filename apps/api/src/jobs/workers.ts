import { Worker } from 'bullmq';
import { queueNames, redisConnection } from './queue.js';
import { processLeadAnalysisJob } from './lead-analysis.worker.js';
import { processWebhookDispatchJob } from './webhook-dispatch.worker.js';
import { NotificationsService } from '../notifications/notifications.service.js';
import { logger } from '../utils/logger.js';

const notificationsService = new NotificationsService();

const analyzeWorker = new Worker<{ leadId: string; organizationId: string }>(
  queueNames.analyzeLead,
  (job) => processLeadAnalysisJob(job.data),
  {
    connection: redisConnection
  }
);

const webhookWorker = new Worker<{ deliveryId: string }>(
  queueNames.dispatchWebhook,
  (job) => processWebhookDispatchJob(job.data),
  {
    connection: redisConnection
  }
);

const notificationWorker = new Worker<{ organizationId: string; leadId: string }>(
  queueNames.sendNotification,
  (job) => notificationsService.sendHighPriorityLeadAlert(job.data),
  {
    connection: redisConnection
  }
);

for (const worker of [analyzeWorker, webhookWorker, notificationWorker]) {
  worker.on('completed', (job) => {
    logger.info({ jobId: job.id, queue: worker.name }, 'Worker job completed');
  });
  worker.on('failed', (job, error) => {
    logger.error({ err: error, jobId: job?.id, queue: worker.name }, 'Worker job failed');
  });
}

async function shutdown() {
  await Promise.all([analyzeWorker.close(), webhookWorker.close(), notificationWorker.close()]);
  await redisConnection.quit();
  process.exit(0);
}

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});

logger.info('AgencyOps workers started');
