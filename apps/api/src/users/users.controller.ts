import type { Request, Response } from 'express';
import { UsersService } from './users.service.js';

const usersService = new UsersService();

export class UsersController {
  list = async (request: Request, response: Response) => {
    const items = await usersService.list(request.auth!.organizationId);
    response.json({ items });
  };
}
