import { prisma } from '../db/prisma.js';
import { AppError } from '../utils/app-error.js';
import { AuditService } from '../audit/audit.service.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import { getPagination } from '../utils/pagination.js';
import type { TaskStatus } from '@agencyops/shared';

const auditService = new AuditService();
const webhooksService = new WebhooksService();

export class TasksService {
  async list(input: {
    organizationId: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: TaskStatus;
  }) {
    const { skip, take, page, pageSize } = getPagination(input);
    const where = {
      organizationId: input.organizationId,
      status: input.status,
      OR: input.search
        ? [
            { title: { contains: input.search, mode: 'insensitive' as const } },
            { description: { contains: input.search, mode: 'insensitive' as const } }
          ]
        : undefined
    };

    const [items, total] = await prisma.$transaction([
      prisma.task.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          assignedTo: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          lead: {
            select: {
              id: true,
              company: true,
              name: true,
              status: true
            }
          }
        }
      }),
      prisma.task.count({ where })
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

  async create(input: {
    organizationId: string;
    userId: string;
    leadId?: string;
    title: string;
    description: string;
    dueAt?: string;
    assignedToId?: string;
  }) {
    if (input.leadId) {
      const lead = await prisma.lead.findFirst({
        where: { id: input.leadId, organizationId: input.organizationId }
      });
      if (!lead) {
        throw new AppError('Lead not found', 404, 'lead_not_found');
      }
    }

    const task = await prisma.task.create({
      data: {
        organizationId: input.organizationId,
        leadId: input.leadId,
        title: input.title,
        description: input.description,
        dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
        assignedToId: input.assignedToId
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lead: {
          select: {
            id: true,
            company: true,
            name: true
          }
        }
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'task.created',
      entityType: 'task',
      entityId: task.id,
      metadata: { leadId: input.leadId }
    });

    await webhooksService.enqueueEvent({
      organizationId: input.organizationId,
      eventType: 'task.created',
      leadId: input.leadId,
      data: {
        taskId: task.id,
        title: task.title,
        leadId: input.leadId
      }
    });

    return task;
  }

  async update(input: {
    organizationId: string;
    userId: string;
    taskId: string;
    title?: string;
    description?: string;
    dueAt?: string | null;
    assignedToId?: string | null;
    status?: TaskStatus;
  }) {
    const task = await prisma.task.findFirst({
      where: {
        id: input.taskId,
        organizationId: input.organizationId
      }
    });

    if (!task) {
      throw new AppError('Task not found', 404, 'task_not_found');
    }

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        title: input.title,
        description: input.description,
        dueAt:
          input.dueAt === undefined ? undefined : input.dueAt === null ? null : new Date(input.dueAt),
        assignedToId: input.assignedToId === undefined ? undefined : input.assignedToId,
        status: input.status
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        lead: {
          select: {
            id: true,
            company: true,
            name: true
          }
        }
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'task.updated',
      entityType: 'task',
      entityId: task.id,
      metadata: { status: input.status }
    });

    return updated;
  }
}
