import { prisma } from '../db/prisma.js';
import { AppError } from '../utils/app-error.js';
import { AuditService } from '../audit/audit.service.js';
import { slugify } from '../utils/slugify.js';

const auditService = new AuditService();

export class SettingsService {
  async get(organizationId: string) {
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        notificationSetting: true
      }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404, 'organization_not_found');
    }

    return organization;
  }

  async update(input: {
    organizationId: string;
    userId: string;
    organizationName?: string;
    emailNotificationsEnabled?: boolean;
    notifyEmail?: string | null;
  }) {
    const organization = await prisma.organization.findUnique({
      where: { id: input.organizationId }
    });

    if (!organization) {
      throw new AppError('Organization not found', 404, 'organization_not_found');
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const nextOrganization =
        input.organizationName && input.organizationName !== organization.name
          ? await transaction.organization.update({
              where: { id: organization.id },
              data: {
                name: input.organizationName,
                slug: slugify(input.organizationName)
              }
            })
          : organization;

      const notificationSetting = await transaction.notificationSetting.upsert({
        where: { organizationId: organization.id },
        create: {
          organizationId: organization.id,
          emailNotificationsEnabled: input.emailNotificationsEnabled ?? false,
          notifyEmail: input.notifyEmail ?? null
        },
        update: {
          emailNotificationsEnabled: input.emailNotificationsEnabled,
          notifyEmail: input.notifyEmail
        }
      });

      return {
        ...nextOrganization,
        notificationSetting
      };
    });

    await auditService.create({
      organizationId: input.organizationId,
      userId: input.userId,
      action: 'settings.updated',
      entityType: 'organization',
      entityId: input.organizationId
    });

    return updated;
  }
}
