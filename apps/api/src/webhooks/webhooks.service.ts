import crypto from 'node:crypto';
import type { WebhookDeliveryStatus } from '@prisma/client';
import { prisma } from '../db/prisma.js';
import { AppError } from '../utils/app-error.js';
import { decryptSecret, encryptSecret } from '../utils/crypto.js';
import { enqueueWebhookDispatch } from '../jobs/queue.js';
import { signWebhookPayload } from './webhook-signature.js';
import { env } from '../config/env.js';
import { AuditService } from '../audit/audit.service.js';
import { getPagination } from '../utils/pagination.js';

const auditService = new AuditService();

function createWebhookSecret() {
  return crypto.randomBytes(24).toString('hex');
}

export class WebhooksService {
  async listEndpoints(organizationId: string) {
    return prisma.webhookEndpoint.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        eventTypes: true,
        createdAt: true,
        updatedAt: true
      }
    });
  }

  async createEndpoint(input: {
    organizationId: string;
    userId: string;
    name: string;
    url: string;
    isActive: boolean;
    eventTypes: string[];
  }) {
    const rawSecret = createWebhookSecret();
    const endpoint = await prisma.webhookEndpoint.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        url: input.url,
        isActive: input.isActive,
        eventTypes: input.eventTypes,
        secret: encryptSecret(rawSecret)
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        eventTypes: true,
        createdAt: true
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'webhook.created',
      entityType: 'webhook_endpoint',
      entityId: endpoint.id,
      metadata: { name: input.name, eventTypes: input.eventTypes }
    });

    return { endpoint, rawSecret };
  }

  async updateEndpoint(input: {
    organizationId: string;
    userId: string;
    endpointId: string;
    name?: string;
    url?: string;
    isActive?: boolean;
    eventTypes?: string[];
    rotateSecret?: boolean;
  }) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: { id: input.endpointId, organizationId: input.organizationId }
    });

    if (!endpoint) {
      throw new AppError('Webhook endpoint not found', 404, 'webhook_not_found');
    }

    const rawSecret = input.rotateSecret ? createWebhookSecret() : undefined;

    const updated = await prisma.webhookEndpoint.update({
      where: { id: endpoint.id },
      data: {
        name: input.name,
        url: input.url,
        isActive: input.isActive,
        eventTypes: input.eventTypes,
        secret: rawSecret ? encryptSecret(rawSecret) : undefined
      },
      select: {
        id: true,
        name: true,
        url: true,
        isActive: true,
        eventTypes: true,
        createdAt: true,
        updatedAt: true
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'webhook.updated',
      entityType: 'webhook_endpoint',
      entityId: endpoint.id
    });

    return {
      endpoint: updated,
      rawSecret
    };
  }

  async deleteEndpoint(input: { organizationId: string; userId: string; endpointId: string }) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: input.endpointId,
        organizationId: input.organizationId
      }
    });

    if (!endpoint) {
      throw new AppError('Webhook endpoint not found', 404, 'webhook_not_found');
    }

    await prisma.webhookEndpoint.delete({
      where: { id: endpoint.id }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'webhook.deleted',
      entityType: 'webhook_endpoint',
      entityId: endpoint.id
    });
  }

  async enqueueEvent(input: {
    organizationId: string;
    eventType: string;
    data: Record<string, unknown>;
    leadId?: string;
  }) {
    const endpoints = await prisma.webhookEndpoint.findMany({
      where: {
        organizationId: input.organizationId,
        isActive: true,
        eventTypes: { has: input.eventType }
      }
    });

    const deliveries = await Promise.all(
      endpoints.map(async (endpoint) => {
        const payload = {
          eventType: input.eventType,
          eventId: crypto.randomUUID(),
          organizationId: input.organizationId,
          timestamp: new Date().toISOString(),
          data: input.data
        };

        const delivery = await prisma.webhookDelivery.create({
          data: {
            webhookEndpointId: endpoint.id,
            leadId: input.leadId,
            eventType: input.eventType,
            payload: payload as never
          }
        });

        await enqueueWebhookDispatch({ deliveryId: delivery.id });
        return delivery;
      })
    );

    return deliveries;
  }

  async testEndpoint(input: { organizationId: string; userId: string; endpointId: string }) {
    const endpoint = await prisma.webhookEndpoint.findFirst({
      where: {
        id: input.endpointId,
        organizationId: input.organizationId
      }
    });

    if (!endpoint) {
      throw new AppError('Webhook endpoint not found', 404, 'webhook_not_found');
    }

    const payload = {
      eventType: 'webhook.test',
      eventId: crypto.randomUUID(),
      organizationId: input.organizationId,
      timestamp: new Date().toISOString(),
      data: {
        endpointId: endpoint.id,
        message: 'AgencyOps test webhook'
      }
    };

    const delivery = await prisma.webhookDelivery.create({
      data: {
        webhookEndpointId: endpoint.id,
        eventType: 'webhook.test',
        payload: payload as never
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'webhook.tested',
      entityType: 'webhook_endpoint',
      entityId: endpoint.id
    });

    await enqueueWebhookDispatch({ deliveryId: delivery.id });
    return delivery;
  }

  async listDeliveries(input: {
    organizationId: string;
    page: number;
    pageSize: number;
    status?: WebhookDeliveryStatus;
    endpointId?: string;
  }) {
    const { skip, take, page, pageSize } = getPagination(input);

    const where = {
      webhookEndpoint: {
        organizationId: input.organizationId
      },
      status: input.status,
      webhookEndpointId: input.endpointId
    };

    const [items, total] = await prisma.$transaction([
      prisma.webhookDelivery.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          webhookEndpoint: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }),
      prisma.webhookDelivery.count({ where })
    ]);

    return {
      items,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    };
  }

  async dispatchDelivery(deliveryId: string) {
    const delivery = await prisma.webhookDelivery.findUnique({
      where: { id: deliveryId },
      include: {
        webhookEndpoint: true
      }
    });

    if (!delivery) {
      return;
    }

    const payload = delivery.payload as Record<string, unknown>;
    const secret = decryptSecret(delivery.webhookEndpoint.secret);
    const signature = signWebhookPayload(secret, payload);

    try {
      const response = await fetch(delivery.webhookEndpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-AgencyOps-Signature': signature
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(env.WEBHOOK_TIMEOUT_MS)
      });
      const responseBody = await response.text();

      if (!response.ok) {
        const error = new Error(`Webhook failed with status ${response.status}: ${responseBody}`) as Error & {
          responseStatus?: number;
        };
        error.responseStatus = response.status;
        throw error;
      }

      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: 'success',
          responseStatus: response.status,
          responseBody,
          attempts: { increment: 1 },
          nextRetryAt: null
        }
      });
    } catch (error) {
      const attempts = delivery.attempts + 1;
      const shouldRetry = attempts < 5;
      const delay = Math.pow(2, attempts) * 1000;
      await prisma.webhookDelivery.update({
        where: { id: delivery.id },
        data: {
          status: shouldRetry ? 'retrying' : 'failed',
          responseStatus:
            error instanceof Error && 'responseStatus' in error
              ? (error.responseStatus as number | undefined)
              : null,
          responseBody: error instanceof Error ? error.message : 'Unknown webhook error',
          attempts,
          nextRetryAt: shouldRetry ? new Date(Date.now() + delay) : null
        }
      });

      if (shouldRetry) {
        await enqueueWebhookDispatch({ deliveryId: delivery.id }, delay);
      }
    }
  }
}
