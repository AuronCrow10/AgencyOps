import { prisma } from '../db/prisma.js';

export class UsersService {
  async list(organizationId: string) {
    return prisma.user.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });
  }
}
