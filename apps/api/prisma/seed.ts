import { PrismaClient, Priority } from '@prisma/client';
import { hashPassword } from '../src/auth/password.js';
import { encryptSecret } from '../src/utils/crypto.js';
import { slugify } from '../src/utils/slugify.js';
import { generateApiKey, hashApiKey } from '../src/api-keys/api-key.utils.js';

const prisma = new PrismaClient();

const demoLeadSeeds = [
  {
    name: 'Maya Chen',
    email: 'maya@latticecommerce.com',
    company: 'Lattice Commerce',
    website: 'https://latticecommerce.example',
    budgetRange: '$15k - $30k',
    serviceNeeded: 'AI automation discovery',
    deadline: '4 weeks',
    message:
      'We want to automate inbound lead triage, proposal generation, and CRM sync for our sales team.',
    priority: Priority.high,
    leadScore: 86,
    category: 'sales_lead',
    sentiment: 'positive'
  },
  {
    name: 'Owen Patel',
    email: 'owen@altitudestudio.com',
    company: 'Altitude Studio',
    website: 'https://altitudestudio.example',
    budgetRange: '$20k - $40k',
    serviceNeeded: 'Website redesign',
    deadline: '6 weeks',
    message: 'Our agency site is dated and we need a conversion-focused redesign with CMS support.',
    priority: Priority.medium,
    leadScore: 72,
    category: 'sales_lead',
    sentiment: 'positive'
  },
  {
    name: 'Iris Novak',
    email: 'iris@chainledger.io',
    company: 'ChainLedger',
    website: 'https://chainledger.example',
    budgetRange: '$50k+',
    serviceNeeded: 'Web3 operations dashboard',
    deadline: '8 weeks',
    message: 'Looking for a data-heavy internal dashboard for treasury, governance, and contributor ops.',
    priority: Priority.high,
    leadScore: 79,
    category: 'sales_lead',
    sentiment: 'neutral'
  },
  {
    name: 'Derek Mills',
    email: 'derek@shopstride.co',
    company: 'ShopStride',
    website: 'https://shopstride.example',
    budgetRange: '$10k - $20k',
    serviceNeeded: 'Shopify integration',
    deadline: '3 weeks',
    message: 'Need custom Shopify app integration with ERP and shipping systems before the next launch.',
    priority: Priority.high,
    leadScore: 83,
    category: 'sales_lead',
    sentiment: 'positive'
  },
  {
    name: 'Sofia Martin',
    email: 'sofia@pipelineforge.io',
    company: 'Pipeline Forge',
    website: 'https://pipelineforge.example',
    budgetRange: '$25k - $50k',
    serviceNeeded: 'CRM automation',
    deadline: '5 weeks',
    message: 'We need HubSpot automation, lead scoring, and a handoff workflow for operations.',
    priority: Priority.high,
    leadScore: 89,
    category: 'sales_lead',
    sentiment: 'positive'
  },
  {
    name: 'Free Traffic Team',
    email: 'blast@spammygrowth.biz',
    company: 'Spammy Growth',
    website: 'http://spammygrowth.biz',
    budgetRange: '$100',
    serviceNeeded: '1 million leads instantly',
    deadline: 'Tomorrow',
    message: 'Need instant guaranteed rankings and traffic for almost no budget. Call now!!!',
    priority: Priority.low,
    leadScore: 8,
    category: 'spam',
    sentiment: 'negative'
  },
  {
    name: 'Noah Rivera',
    email: 'noah@harborsupport.io',
    company: 'Harbor Support',
    website: 'https://harborsupport.example',
    budgetRange: '$5k - $10k',
    serviceNeeded: 'Urgent support request',
    deadline: '48 hours',
    message: 'Our internal case-routing tool is failing and we need immediate engineering support.',
    priority: Priority.urgent,
    leadScore: 76,
    category: 'support_request',
    sentiment: 'negative'
  },
  {
    name: 'Emma Walsh',
    email: 'emma@partnergrid.com',
    company: 'PartnerGrid',
    website: 'https://partnergrid.example',
    budgetRange: 'TBD',
    serviceNeeded: 'Partnership exploration',
    deadline: 'This quarter',
    message: 'Interested in a delivery partnership for complex CRM and RevOps implementations.',
    priority: Priority.medium,
    leadScore: 64,
    category: 'partnership',
    sentiment: 'positive'
  },
  {
    name: 'Leo Anders',
    email: 'leo@shipdraft.app',
    company: 'ShipDraft',
    website: 'https://shipdraft.example',
    budgetRange: '$40k - $60k',
    serviceNeeded: 'SaaS MVP',
    deadline: '10 weeks',
    message: 'We need an MVP for an operations-focused SaaS product with auth, billing, and dashboards.',
    priority: Priority.high,
    leadScore: 91,
    category: 'sales_lead',
    sentiment: 'positive'
  },
  {
    name: 'Priya Raman',
    email: 'priya@fieldopslab.com',
    company: 'FieldOps Lab',
    website: 'https://fieldopslab.example',
    budgetRange: '$18k - $28k',
    serviceNeeded: 'Internal tool build',
    deadline: '6 weeks',
    message: 'We need an internal operations portal for intake, scheduling, and field team coordination.',
    priority: Priority.high,
    leadScore: 84,
    category: 'sales_lead',
    sentiment: 'positive'
  }
];

async function main() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Seed script refuses to run in production.');
  }

  const organizationName = 'Northstar Digital Agency';
  const organizationSlug = slugify(organizationName);
  const passwordHash = await hashPassword('ChangeMe123!');

  const organization = await prisma.organization.upsert({
    where: { slug: organizationSlug },
    update: { name: organizationName },
    create: {
      name: organizationName,
      slug: organizationSlug,
      notificationSetting: {
        create: {
          emailNotificationsEnabled: true,
          notifyEmail: 'ops@northstaragency.dev'
        }
      }
    }
  });

  const owner = await prisma.user.upsert({
    where: { email: 'demo@agencyops.dev' },
    update: {
      name: 'Demo Owner',
      passwordHash,
      role: 'owner',
      organizationId: organization.id
    },
    create: {
      email: 'demo@agencyops.dev',
      name: 'Demo Owner',
      passwordHash,
      role: 'owner',
      organizationId: organization.id
    }
  });

  await prisma.task.deleteMany({ where: { organizationId: organization.id } });
  await prisma.aIAnalysis.deleteMany({ where: { lead: { organizationId: organization.id } } });
  await prisma.webhookDelivery.deleteMany({
    where: { webhookEndpoint: { organizationId: organization.id } }
  });
  await prisma.lead.deleteMany({ where: { organizationId: organization.id } });
  await prisma.auditLog.deleteMany({ where: { organizationId: organization.id } });

  const leads = [];
  for (const [index, seed] of demoLeadSeeds.entries()) {
    const lead = await prisma.lead.create({
      data: {
        organizationId: organization.id,
        source: 'demo_seed',
        name: seed.name,
        email: seed.email,
        company: seed.company,
        website: seed.website,
        budgetRange: seed.budgetRange,
        serviceNeeded: seed.serviceNeeded,
        deadline: seed.deadline,
        message: seed.message,
        priority: seed.priority,
        leadScore: seed.leadScore,
        category: seed.category as never,
        sentiment: seed.sentiment as never,
        summary: `Seeded demo lead for ${seed.company}.`,
        suggestedReply: `Thanks ${seed.name.split(' ')[0]}, we reviewed your request and can schedule a discovery call this week.`,
        recommendedNextStep:
          seed.category === 'spam' ? 'Archive this inquiry.' : 'Schedule qualification call and prepare estimate.',
        status: seed.category === 'spam' ? 'archived' : index < 3 ? 'qualified' : 'new',
        aiAnalysisStatus: 'completed'
      }
    });

    await prisma.aIAnalysis.create({
      data: {
        leadId: lead.id,
        provider: 'mock',
        model: 'mock-v1',
        rawInput: { company: seed.company, message: seed.message },
        rawOutput: { category: seed.category, score: seed.leadScore },
        parsedOutput: {
          summary: lead.summary,
          category: seed.category,
          priority: seed.priority,
          leadScore: seed.leadScore,
          sentiment: seed.sentiment,
          suggestedReply: lead.suggestedReply,
          recommendedNextStep: lead.recommendedNextStep
        },
        costEstimate: 0
      }
    });

    leads.push(lead);
  }

  for (const lead of leads.slice(0, 4)) {
    await prisma.task.create({
      data: {
        organizationId: organization.id,
        leadId: lead.id,
        assignedToId: owner.id,
        title: `Follow up with ${lead.company}`,
        description: `Review AI analysis and schedule next step for ${lead.company}.`,
        status: 'open'
      }
    });
  }

  const webhookSecret = encryptSecret('northstar-demo-webhook-secret');
  const webhook = await prisma.webhookEndpoint.upsert({
    where: { id: 'northstar-demo-webhook' },
    update: {
      organizationId: organization.id,
      name: 'Northstar Demo Webhook',
      url: 'https://example-webhook.site/agencyops-demo',
      secret: webhookSecret,
      isActive: true,
      eventTypes: ['lead.created', 'lead.analyzed', 'task.created']
    },
    create: {
      id: 'northstar-demo-webhook',
      organizationId: organization.id,
      name: 'Northstar Demo Webhook',
      url: 'https://example-webhook.site/agencyops-demo',
      secret: webhookSecret,
      isActive: true,
      eventTypes: ['lead.created', 'lead.analyzed', 'task.created']
    }
  });

  await prisma.webhookDelivery.createMany({
    data: leads.slice(0, 3).map((lead, index) => ({
      webhookEndpointId: webhook.id,
      leadId: lead.id,
      eventType: index % 2 === 0 ? 'lead.analyzed' : 'lead.created',
      payload: { leadId: lead.id, organizationId: organization.id },
      status: index === 2 ? 'retrying' : 'success',
      responseStatus: index === 2 ? 500 : 200,
      responseBody: index === 2 ? 'Temporary upstream error' : 'OK',
      attempts: index === 2 ? 2 : 1
    }))
  });

  await prisma.auditLog.createMany({
    data: [
      {
        organizationId: organization.id,
        userId: owner.id,
        action: 'auth.registered',
        entityType: 'user',
        entityId: owner.id,
        metadata: { email: owner.email }
      },
      {
        organizationId: organization.id,
        userId: owner.id,
        action: 'settings.updated',
        entityType: 'notification_setting',
        metadata: { notifyEmail: 'ops@northstaragency.dev' }
      },
      {
        organizationId: organization.id,
        action: 'lead.analyzed',
        entityType: 'lead',
        entityId: leads[0]?.id,
        metadata: { provider: 'mock', score: leads[0]?.leadScore }
      }
    ]
  });

  const rawApiKey = generateApiKey();
  await prisma.apiKey.create({
    data: {
      organizationId: organization.id,
      name: 'Demo Intake Integration',
      keyHash: await hashApiKey(rawApiKey)
    }
  });

  console.log('AgencyOps demo seed complete.');
  console.log(`Organization: ${organization.name} (${organization.slug})`);
  console.log('Demo credentials:');
  console.log('  email: demo@agencyops.dev');
  console.log('  password: ChangeMe123!');
  console.log('Demo API key (shown once):');
  console.log(`  ${rawApiKey}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
