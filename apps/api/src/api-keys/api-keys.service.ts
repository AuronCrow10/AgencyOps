import { prisma } from '../db/prisma.js';
import { AppError } from '../utils/app-error.js';
import { generateApiKey, hashApiKey, verifyApiKeyHash } from './api-key.utils.js';
import { AuditService } from '../audit/audit.service.js';

const auditService = new AuditService();

export class ApiKeysService {
  async list(organizationId: string) {
    return prisma.apiKey.findMany({
      where: {
        organizationId
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
        revokedAt: true
      }
    });
  }

  async create(input: { organizationId: string; userId: string; name: string }) {
    const rawKey = generateApiKey();
    const key = await prisma.apiKey.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        keyHash: await hashApiKey(rawKey)
      },
      select: {
        id: true,
        name: true,
        createdAt: true
      }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'api_key.created',
      entityType: 'api_key',
      entityId: key.id,
      metadata: { name: input.name }
    });

    return {
      apiKey: key,
      rawKey
    };
  }

  async revoke(input: { organizationId: string; userId: string; apiKeyId: string }) {
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: input.apiKeyId,
        organizationId: input.organizationId,
        revokedAt: null
      }
    });

    if (!apiKey) {
      throw new AppError('API key not found', 404, 'api_key_not_found');
    }

    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { revokedAt: new Date() }
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'api_key.revoked',
      entityType: 'api_key',
      entityId: apiKey.id
    });
  }

  async resolveOrganizationByRawKey(rawKey: string) {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        revokedAt: null
      },
      include: {
        organization: true
      }
    });

    for (const apiKey of apiKeys) {
      if (await verifyApiKeyHash(apiKey.keyHash, rawKey)) {
        await prisma.apiKey.update({
          where: { id: apiKey.id },
          data: { lastUsedAt: new Date() }
        });
        return apiKey.organization;
      }
    }

    throw new AppError('Invalid API key', 401, 'invalid_api_key');
  }
}
