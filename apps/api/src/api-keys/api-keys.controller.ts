import type { Request, Response } from 'express';
import { z } from 'zod';
import { ApiKeysService } from './api-keys.service.js';

const createApiKeySchema = z.object({
  name: z.string().trim().min(2).max(120)
});

const apiKeysService = new ApiKeysService();

export class ApiKeysController {
  list = async (request: Request, response: Response) => {
    const items = await apiKeysService.list(request.auth!.organizationId);
    response.json({ items });
  };

  create = async (request: Request, response: Response) => {
    const payload = createApiKeySchema.parse(request.body);
    const result = await apiKeysService.create({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      name: payload.name
    });
    response.status(201).json(result);
  };

  revoke = async (request: Request, response: Response) => {
    await apiKeysService.revoke({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      apiKeyId: String(request.params.id)
    });
    response.status(204).send();
  };
}
