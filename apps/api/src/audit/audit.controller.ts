import type { Request, Response } from 'express';
import { z } from 'zod';
import { paginationQuerySchema } from '@agencyops/shared';
import { AuditService } from './audit.service.js';

const emptyStringToUndefined = <TSchema extends z.ZodTypeAny>(schema: TSchema) =>
  z.preprocess((value) => (value === '' ? undefined : value), schema.optional());

const querySchema = paginationQuerySchema.extend({
  action: emptyStringToUndefined(z.string().trim()),
  entityType: emptyStringToUndefined(z.string().trim())
});

const auditService = new AuditService();

export class AuditController {
  list = async (request: Request, response: Response) => {
    const query = querySchema.parse(request.query);
    const result = await auditService.listForOrganization({
      organizationId: request.auth!.organizationId,
      page: query.page,
      pageSize: query.pageSize,
      action: query.action,
      entityType: query.entityType
    });
    response.json(result);
  };
}
