import { prisma } from '../db/prisma.js';
import { getPagination } from '../utils/pagination.js';

type CreateAuditLogInput = {
  organizationId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: unknown;
};

export class AuditService {
  async create(input: CreateAuditLogInput) {
    return prisma.auditLog.create({
      data: {
        organizationId: input.organizationId,
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        metadata: input.metadata as never
      }
    });
  }

  async listForOrganization(input: {
    organizationId: string;
    page: number;
    pageSize: number;
    action?: string;
    entityType?: string;
  }) {
    const { skip, take, page, pageSize } = getPagination(input);
    const where = {
      organizationId: input.organizationId,
      action: input.action || undefined,
      entityType: input.entityType || undefined
    };

    const [items, total] = await prisma.$transaction([
      prisma.auditLog.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.auditLog.count({ where })
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
}
