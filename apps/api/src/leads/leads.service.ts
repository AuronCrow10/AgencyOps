import { prisma } from '../db/prisma.js';
import { LeadsRepository } from './leads.repository.js';
import { AppError } from '../utils/app-error.js';
import { AuditService } from '../audit/audit.service.js';
import { enqueueLeadAnalysis } from '../jobs/queue.js';
import { getPagination } from '../utils/pagination.js';
import { WebhooksService } from '../webhooks/webhooks.service.js';
import { ApiKeysService } from '../api-keys/api-keys.service.js';
import type { AIAnalysisResult, LeadStatus, Priority } from '@agencyops/shared';
import { canTransitionStatus } from './lead-status.js';

const auditService = new AuditService();
const webhooksService = new WebhooksService();
const apiKeysService = new ApiKeysService();

export class LeadsService {
  private readonly leadsRepository = new LeadsRepository();

  async list(input: {
    organizationId: string;
    page: number;
    pageSize: number;
    search?: string;
    status?: LeadStatus;
    priority?: Priority;
    category?: AIAnalysisResult['category'];
  }) {
    const { skip, take, page, pageSize } = getPagination(input);
    const where = {
      organizationId: input.organizationId,
      status: input.status,
      priority: input.priority,
      category: input.category,
      OR: input.search
        ? [
            { name: { contains: input.search, mode: 'insensitive' as const } },
            { email: { contains: input.search, mode: 'insensitive' as const } },
            { company: { contains: input.search, mode: 'insensitive' as const } },
            { serviceNeeded: { contains: input.search, mode: 'insensitive' as const } },
            { message: { contains: input.search, mode: 'insensitive' as const } }
          ]
        : undefined
    };

    const [items, total] = await prisma.$transaction([
      this.leadsRepository.list({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      this.leadsRepository.count({ where })
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

  async getById(organizationId: string, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: leadId,
        organizationId
      },
      include: {
        tasks: {
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        analyses: {
          orderBy: { createdAt: 'desc' }
        },
        webhookDeliveries: {
          include: {
            webhookEndpoint: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404, 'lead_not_found');
    }

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        organizationId,
        entityType: 'lead',
        entityId: leadId
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    return {
      ...lead,
      auditLogs
    };
  }

  async createPublicLead(input: {
    rawApiKey?: string;
    organizationSlug?: string;
    source: string;
    name: string;
    email: string;
    company: string;
    website?: string;
    budgetRange: string;
    serviceNeeded: string;
    deadline: string;
    message: string;
  }) {
    const organization = input.rawApiKey
      ? await apiKeysService.resolveOrganizationByRawKey(input.rawApiKey)
      : await prisma.organization.findUnique({
          where: {
            slug: input.organizationSlug
          }
        });

    if (!organization) {
      throw new AppError('Organization could not be resolved', 400, 'organization_required');
    }

    const lead = await prisma.lead.create({
      data: {
        organizationId: organization.id,
        source: input.source,
        name: input.name,
        email: input.email,
        company: input.company,
        website: input.website,
        budgetRange: input.budgetRange,
        serviceNeeded: input.serviceNeeded,
        deadline: input.deadline,
        message: input.message,
        status: 'new',
        aiAnalysisStatus: 'pending'
      }
    });

    await auditService.create({
      organizationId: organization.id,
      action: 'lead.created',
      entityType: 'lead',
      entityId: lead.id,
      metadata: {
        source: input.source
      }
    });

    await enqueueLeadAnalysis({
      leadId: lead.id,
      organizationId: organization.id
    });

    await webhooksService.enqueueEvent({
      organizationId: organization.id,
      eventType: 'lead.created',
      leadId: lead.id,
      data: {
        leadId: lead.id,
        company: lead.company,
        source: lead.source
      }
    });

    return lead;
  }

  async updateStatus(input: {
    organizationId: string;
    userId: string;
    leadId: string;
    status: LeadStatus;
  }) {
    const lead = await this.leadsRepository.findFirst({
      where: {
        id: input.leadId,
        organizationId: input.organizationId
      }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404, 'lead_not_found');
    }

    if (!canTransitionStatus(lead.status, input.status)) {
      throw new AppError('Invalid lead status transition', 400, 'invalid_status_transition');
    }

    const updated = await this.leadsRepository.update({
      where: { id: lead.id },
      data: {
        status: input.status
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'lead.status_changed',
      entityType: 'lead',
      entityId: lead.id,
      metadata: {
        from: lead.status,
        to: input.status
      }
    });

    await webhooksService.enqueueEvent({
      organizationId: input.organizationId,
      eventType: 'lead.status_changed',
      leadId: lead.id,
      data: {
        leadId: lead.id,
        previousStatus: lead.status,
        status: input.status
      }
    });

    return updated;
  }

  async rerunAnalysis(input: { organizationId: string; userId: string; leadId: string }) {
    const lead = await this.leadsRepository.findFirst({
      where: { id: input.leadId, organizationId: input.organizationId }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404, 'lead_not_found');
    }

    await this.leadsRepository.update({
      where: { id: lead.id },
      data: {
        status: 'analyzing',
        aiAnalysisStatus: 'pending'
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'lead.analysis_rerun',
      entityType: 'lead',
      entityId: lead.id
    });

    await enqueueLeadAnalysis({
      leadId: lead.id,
      organizationId: input.organizationId
    });
  }

  async applyAiAnalysis(input: {
    leadId: string;
    organizationId: string;
    analysis: AIAnalysisResult;
    provider: string;
    model: string;
    rawInput: unknown;
    rawOutput: unknown;
    costEstimate?: number;
  }) {
    const lead = await this.leadsRepository.findFirst({
      where: { id: input.leadId, organizationId: input.organizationId }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404, 'lead_not_found');
    }

    const { updatedLead, createdTask } = await prisma.$transaction(async (transaction) => {
      await transaction.aIAnalysis.create({
        data: {
          leadId: lead.id,
          provider: input.provider,
          model: input.model,
          rawInput: input.rawInput as never,
          rawOutput: input.rawOutput as never,
          parsedOutput: input.analysis as never,
          costEstimate: input.costEstimate
        }
      });

      const nextStatus = input.analysis.category === 'spam' ? 'archived' : 'qualified';
      const updatedLead = await transaction.lead.update({
        where: { id: lead.id },
        data: {
          summary: input.analysis.summary,
          category: input.analysis.category,
          priority: input.analysis.priority,
          leadScore: input.analysis.leadScore,
          sentiment: input.analysis.sentiment,
          suggestedReply: input.analysis.suggestedReply,
          recommendedNextStep: input.analysis.recommendedNextStep,
          status: nextStatus,
          aiAnalysisStatus: 'completed'
        }
      });

      let createdTask: { id: string; title: string } | null = null;
      if (
        input.analysis.category !== 'spam' &&
        input.analysis.leadScore >= 75 &&
        input.analysis.priority !== 'low'
      ) {
        createdTask = await transaction.task.create({
          data: {
            organizationId: input.organizationId,
            leadId: lead.id,
            title: `Follow up with ${lead.company}`,
            description: `AI suggests: ${input.analysis.recommendedNextStep}`,
            status: 'open'
          },
          select: {
            id: true,
            title: true
          }
        });
      }

      return { updatedLead, createdTask };
    });

    await auditService.create({
      organizationId: input.organizationId,
      action: 'lead.analyzed',
      entityType: 'lead',
      entityId: lead.id,
      metadata: {
        provider: input.provider,
        score: input.analysis.leadScore,
        category: input.analysis.category
      }
    });

    await webhooksService.enqueueEvent({
      organizationId: input.organizationId,
      eventType: 'lead.analyzed',
      leadId: lead.id,
      data: {
        leadId: lead.id,
        category: input.analysis.category,
        priority: input.analysis.priority,
        leadScore: input.analysis.leadScore
      }
    });

    if (createdTask) {
      await auditService.create({
        organizationId: input.organizationId,
        action: 'task.created',
        entityType: 'task',
        entityId: createdTask.id,
        metadata: { leadId: lead.id, automated: true }
      });

      await webhooksService.enqueueEvent({
        organizationId: input.organizationId,
        eventType: 'task.created',
        leadId: lead.id,
        data: {
          taskId: createdTask.id,
          leadId: lead.id,
          title: createdTask.title
        }
      });
    }

    return updatedLead;
  }

  async markAnalysisFailed(input: {
    leadId: string;
    organizationId: string;
    reason: string;
  }) {
    await this.leadsRepository.update({
      where: { id: input.leadId },
      data: {
        aiAnalysisStatus: 'failed',
        status: 'new'
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      action: 'lead.analysis_failed',
      entityType: 'lead',
      entityId: input.leadId,
      metadata: { reason: input.reason }
    });
  }

  async getDashboardMetrics(organizationId: string) {
    const [totalLeads, newLeads, highPriorityLeads, wonLeads, recentLeads, recentTasks, recentWebhookDeliveries] =
      await prisma.$transaction([
        prisma.lead.count({ where: { organizationId } }),
        prisma.lead.count({ where: { organizationId, status: 'new' } }),
        prisma.lead.count({ where: { organizationId, priority: { in: ['high', 'urgent'] } } }),
        prisma.lead.count({ where: { organizationId, status: 'won' } }),
        prisma.lead.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 5
        }),
        prisma.task.findMany({
          where: { organizationId },
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            assignedTo: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }),
        prisma.webhookDelivery.findMany({
          where: {
            webhookEndpoint: {
              organizationId
            }
          },
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            webhookEndpoint: {
              select: {
                id: true,
                name: true
              }
            }
          }
        })
      ]);

    return {
      totalLeads,
      newLeads,
      highPriorityLeads,
      conversionRate: totalLeads === 0 ? 0 : Number(((wonLeads / totalLeads) * 100).toFixed(2)),
      recentLeads,
      recentTasks,
      recentWebhookDeliveries
    };
  }
}
