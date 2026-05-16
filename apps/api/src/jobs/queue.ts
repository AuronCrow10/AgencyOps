import { Queue } from 'bullmq';
import { Redis } from 'ioredis';
import { env } from '../config/env.js';

export const redisConnection = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null
});

export const queueNames = {
  analyzeLead: 'analyze-lead',
  dispatchWebhook: 'dispatch-webhook',
  sendNotification: 'send-notification'
} as const;

export const analyzeLeadQueue = new Queue(queueNames.analyzeLead, {
  connection: redisConnection
});

export const dispatchWebhookQueue = new Queue(queueNames.dispatchWebhook, {
  connection: redisConnection
});

export const sendNotificationQueue = new Queue(queueNames.sendNotification, {
  connection: redisConnection
});

export async function enqueueLeadAnalysis(payload: { leadId: string; organizationId: string }) {
  await analyzeLeadQueue.add(queueNames.analyzeLead, payload, {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 100
  });
}

export async function enqueueWebhookDispatch(payload: { deliveryId: string }, delay = 0) {
  await dispatchWebhookQueue.add(queueNames.dispatchWebhook, payload, {
    attempts: 1,
    delay,
    removeOnComplete: 100,
    removeOnFail: 100
  });
}

export async function enqueueNotification(payload: { organizationId: string; leadId: string }) {
  await sendNotificationQueue.add(queueNames.sendNotification, payload, {
    attempts: 3,
    removeOnComplete: 100,
    removeOnFail: 100
  });
}
