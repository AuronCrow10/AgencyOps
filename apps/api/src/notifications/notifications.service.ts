import { prisma } from '../db/prisma.js';
import { MockNotificationProvider } from './mock-notification.provider.js';
import { ResendNotificationProvider } from './resend-notification.provider.js';
import { SmtpNotificationProvider } from './smtp-notification.provider.js';
import { env } from '../config/env.js';

function createProvider() {
  switch (env.EMAIL_PROVIDER) {
    case 'resend':
      return new ResendNotificationProvider();
    case 'smtp':
      return new SmtpNotificationProvider();
    default:
      return new MockNotificationProvider();
  }
}

const provider = createProvider();

export class NotificationsService {
  async sendHighPriorityLeadAlert(input: { organizationId: string; leadId: string }) {
    const lead = await prisma.lead.findFirst({
      where: {
        id: input.leadId,
        organizationId: input.organizationId
      }
    });

    if (!lead || !['high', 'urgent'].includes(lead.priority)) {
      return;
    }

    const settings = await prisma.notificationSetting.findUnique({
      where: { organizationId: input.organizationId }
    });

    if (!settings?.emailNotificationsEnabled || !settings.notifyEmail) {
      return;
    }

    await provider.send({
      to: settings.notifyEmail,
      subject: `[AgencyOps] ${lead.priority.toUpperCase()} lead: ${lead.company}`,
      text: `${lead.name} from ${lead.company} submitted a ${lead.priority} priority request. Lead score: ${lead.leadScore ?? 'n/a'}.`
    });
  }
}
