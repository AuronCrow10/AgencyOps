import type { Request, Response } from 'express';
import { createTaskSchema, taskListQuerySchema, updateTaskSchema } from './tasks.schemas.js';
import { TasksService } from './tasks.service.js';

const tasksService = new TasksService();

export class TasksController {
  list = async (request: Request, response: Response) => {
    const query = taskListQuerySchema.parse(request.query);
    const result = await tasksService.list({
      organizationId: request.auth!.organizationId,
      page: query.page,
      pageSize: query.pageSize,
      search: query.search,
      status: query.status
    });
    response.json(result);
  };

  create = async (request: Request, response: Response) => {
    const payload = createTaskSchema.parse(request.body);
    const task = await tasksService.create({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      ...payload
    });
    response.status(201).json({ task });
  };

  update = async (request: Request, response: Response) => {
    const payload = updateTaskSchema.parse(request.body);
    const task = await tasksService.update({
      organizationId: request.auth!.organizationId,
      userId: request.auth!.userId,
      taskId: String(request.params.id),
      ...payload
    });
    response.json({ task });
  };
}
