export type Lead = {
  id: string;
  source: string;
  name: string;
  email: string;
  company: string;
  website?: string | null;
  budgetRange: string;
  serviceNeeded: string;
  deadline: string;
  message: string;
  status: 'new' | 'analyzing' | 'qualified' | 'contacted' | 'won' | 'lost' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  leadScore?: number | null;
  category?: 'sales_lead' | 'support_request' | 'partnership' | 'spam' | 'other' | null;
  sentiment?: 'negative' | 'neutral' | 'positive' | null;
  summary?: string | null;
  suggestedReply?: string | null;
  recommendedNextStep?: string | null;
  aiAnalysisStatus: 'pending' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'completed' | 'canceled';
  dueAt?: string | null;
  createdAt: string;
  assignedTo?: { id: string; name: string; email?: string } | null;
  lead?: { id: string; company: string; name: string; status?: string } | null;
};

export type WebhookEndpoint = {
  id: string;
  name: string;
  url: string;
  isActive: boolean;
  eventTypes: string[];
  createdAt: string;
  updatedAt?: string;
};

export type WebhookDelivery = {
  id: string;
  eventType: string;
  status: 'pending' | 'success' | 'failed' | 'retrying';
  responseStatus?: number | null;
  responseBody?: string | null;
  attempts: number;
  createdAt: string;
  webhookEndpoint: {
    id: string;
    name: string;
  };
};

export type AuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  } | null;
};
