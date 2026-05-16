import type { Request, Response } from 'express';
import { leadListQuerySchema, publicLeadCreateSchema, updateLeadStatusSchema } from './leads.schemas.js';
import { LeadsService } from './leads.service.js';

const leadsService = new LeadsService();

function getApiKey(request: Request) {
  const headerValue = request.header('x-api-key');
  const authHeader = request.header('authorization');
  if (headerValue) {
    return headerValue;
  }
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  return undefined;
}

export class LeadsController {
  dashboard = async (request: Request, response: Response) => {
    const metrics = await leadsService.getDashboardMetrics(request.auth!.organizationId);
    response.json({ metrics });
  };

  list = async (request: Request, response: Response) => {
    const query = leadListQuerySchema.parse(request.query);
    const result = await leadsService.list({
      organizationId: request.auth!.organizationId,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status,
      priority: query.priority,
      category: query.category
    });
    response.json(result);
  };

  getById = async (request: Request, response: Response) => {
    const lead = await leadsService.getById(request.auth!.organizationId, String(request.params.id));
    response.json({ lead });
  };

  createPublic = async (request: Request, response: Response) => {
    const payload = publicLeadCreateSchema.parse(request.body);
    await leadsService.createPublicLead({
      ...payload,
      source: getApiKey(request) ? 'api_key' : 'public_form',
      rawApiKey: getApiKey(request)
    });
    response.status(201).json({
      success: true,
      message: 'Lead received successfully.'
    });
  };

  updateStatus = async (request: Request, response: Response) => {
    const payload = updateLeadStatusSchema.parse(request.body);
    const lead = await leadsService.updateStatus({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      leadId: String(request.params.id),
      status: payload.status
    });
    response.json({ lead });
  };

  rerunAnalysis = async (request: Request, response: Response) => {
    await leadsService.rerunAnalysis({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      leadId: String(request.params.id)
    });
    response.status(202).json({
      success: true
    });
  };
}
