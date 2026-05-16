import type { Request, Response } from 'express';
import { createWebhookSchema, updateWebhookSchema, webhookDeliveryListSchema } from './webhooks.schemas.js';
import { WebhooksService } from './webhooks.service.js';

const webhooksService = new WebhooksService();

export class WebhooksController {
  listEndpoints = async (request: Request, response: Response) => {
    const items = await webhooksService.listEndpoints(request.auth!.organizationId);
    response.json({ items });
  };

  createEndpoint = async (request: Request, response: Response) => {
    const payload = createWebhookSchema.parse(request.body);
    const result = await webhooksService.createEndpoint({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      ...payload
    });
    response.status(201).json(result);
  };

  updateEndpoint = async (request: Request, response: Response) => {
    const payload = updateWebhookSchema.parse(request.body);
    const result = await webhooksService.updateEndpoint({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      endpointId: String(request.params.id),
      ...payload
    });
    response.json(result);
  };

  deleteEndpoint = async (request: Request, response: Response) => {
    await webhooksService.deleteEndpoint({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      endpointId: String(request.params.id)
    });
    response.status(204).send();
  };

  testEndpoint = async (request: Request, response: Response) => {
    const delivery = await webhooksService.testEndpoint({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      endpointId: String(request.params.id)
    });
    response.status(202).json({ delivery });
  };

  listDeliveries = async (request: Request, response: Response) => {
    const query = webhookDeliveryListSchema.parse(request.query);
    const result = await webhooksService.listDeliveries({
      organizationId: request.auth!.organizationId,
      page: query.page,
      pageSize: query.pageSize,
      status: query.status,
      endpointId: query.endpointId
    });
    response.json(result);
  };
}
