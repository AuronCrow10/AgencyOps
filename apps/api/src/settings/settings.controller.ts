import type { Request, Response } from 'express';
import { updateSettingsSchema } from './settings.schemas.js';
import { SettingsService } from './settings.service.js';

const settingsService = new SettingsService();

export class SettingsController {
  get = async (request: Request, response: Response) => {
    const settings = await settingsService.get(request.auth!.organizationId);
    response.json({ settings });
  };

  update = async (request: Request, response: Response) => {
    const payload = updateSettingsSchema.parse(request.body);
    const settings = await settingsService.update({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      ...payload
    });
    response.json({ settings });
  };
}
