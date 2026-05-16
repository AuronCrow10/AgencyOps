import { WebhooksService } from '../webhooks/webhooks.service.js';

const webhooksService = new WebhooksService();

export async function processWebhookDispatchJob(payload: { deliveryId: string }) {
  await webhooksService.dispatchDelivery(payload.deliveryId);
}
