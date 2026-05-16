import { AIService } from '../ai/ai.service.js';
import { LeadsService } from '../leads/leads.service.js';
import { prisma } from '../db/prisma.js';
import { logger } from '../utils/logger.js';
import { enqueueNotification } from './queue.js';

const aiService = new AIService();
const leadsService = new LeadsService();

export async function processLeadAnalysisJob(payload: {
  leadId: string;
  organizationId: string;
}) {
  const lead = await prisma.lead.findFirst({
    where: {
      id: payload.leadId,
      organizationId: payload.organizationId
    }
  });

  if (!lead) {
    logger.warn(payload, 'Lead not found for analysis job');
    return;
  }

  await prisma.lead.update({
    where: { id: lead.id },
    data: {
      status: 'analyzing'
    }
  });

  try {
    const result = await aiService.analyzeLead({
      company: lead.company,
      serviceNeeded: lead.serviceNeeded,
      budgetRange: lead.budgetRange,
      deadline: lead.deadline,
      website: lead.website,
      message: lead.message,
      email: lead.email,
      name: lead.name
    });

    const updatedLead = await leadsService.applyAiAnalysis({
      leadId: lead.id,
      organizationId: lead.organizationId,
      analysis: result.parsedOutput,
      provider: result.provider,
      model: result.model,
      rawInput: result.rawInput,
      rawOutput: result.rawOutput,
      costEstimate: result.costEstimate
    });

    if (['high', 'urgent'].includes(updatedLead.priority)) {
      await enqueueNotification({
        organizationId: updatedLead.organizationId,
        leadId: updatedLead.id
      });
    }
  } catch (error) {
    logger.error({ err: error, leadId: lead.id }, 'Lead analysis failed');
    await leadsService.markAnalysisFailed({
      leadId: lead.id,
      organizationId: lead.organizationId,
      reason: error instanceof Error ? error.message : 'Unknown AI analysis error'
    });
  }
}
