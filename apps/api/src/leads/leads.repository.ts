import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../db/prisma.js';

export class LeadsRepository {
  constructor(private readonly client: PrismaClient | Prisma.TransactionClient = prisma) {}

  list(args: Prisma.LeadFindManyArgs) {
    return this.client.lead.findMany(args);
  }

  count(args: Prisma.LeadCountArgs) {
    return this.client.lead.count(args);
  }

  findById(id: string) {
    return this.client.lead.findUnique({
      where: { id }
    });
  }

  findFirst(args: Prisma.LeadFindFirstArgs) {
    return this.client.lead.findFirst(args);
  }

  create(args: Prisma.LeadCreateArgs) {
    return this.client.lead.create(args);
  }

  update(args: Prisma.LeadUpdateArgs) {
    return this.client.lead.update(args);
  }
}
