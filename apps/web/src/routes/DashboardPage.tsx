import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Card, EmptyState } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { Lead, Task, WebhookDelivery } from '../lib/domain';

export function DashboardPage() {
  const dashboardQuery = useQuery({
    queryKey: ['dashboard'],
    queryFn: () =>
      api.get<{
        metrics: {
          totalLeads: number;
          newLeads: number;
          highPriorityLeads: number;
          conversionRate: number;
          recentLeads: Lead[];
          recentTasks: Task[];
          recentWebhookDeliveries: WebhookDelivery[];
        };
      }>('/api/leads/dashboard')
  });

  const metrics = dashboardQuery.data?.metrics;
  const metricCards: Array<{ label: string; value: number }> = [
    { label: 'Total leads', value: metrics?.totalLeads ?? 0 },
    { label: 'New leads', value: metrics?.newLeads ?? 0 },
    { label: 'High priority', value: metrics?.highPriorityLeads ?? 0 },
    { label: 'Conversion %', value: metrics?.conversionRate ?? 0 }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-ink">Operations Dashboard</h1>
        <p className="mt-2 text-sm text-slate-500">Monitor new leads, task load and webhook activity in one place.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.map((item) => (
          <Card key={item.label} title={item.label}>
            <p className="text-3xl font-semibold text-ink">{String(item.value)}</p>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Recent leads" className="xl:col-span-2">
          {metrics?.recentLeads.length ? (
            <div className="space-y-4">
              {metrics.recentLeads.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">{lead.company}</p>
                    <p className="text-sm text-slate-500">
                      {lead.serviceNeeded} · {lead.status}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(lead.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No leads yet" description="New public or API intake submissions will appear here." />
          )}
        </Card>

        <Card title="Recent tasks">
          {metrics?.recentTasks.length ? (
            <div className="space-y-4">
              {metrics.recentTasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 px-4 py-3">
                  <p className="font-medium text-ink">{task.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{task.status}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No tasks yet" description="Tasks generated from leads or operators will appear here." />
          )}
        </Card>
      </div>

      <Card title="Recent webhook deliveries">
        {metrics?.recentWebhookDeliveries.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Attempts</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {metrics.recentWebhookDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="border-t border-slate-100">
                    <td className="py-3">{delivery.webhookEndpoint.name}</td>
                    <td className="py-3">{delivery.eventType}</td>
                    <td className="py-3">{delivery.status}</td>
                    <td className="py-3">{delivery.attempts}</td>
                    <td className="py-3">{formatDate(delivery.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No deliveries yet" description="Webhook delivery attempts will appear after lead and task events." />
        )}
      </Card>
    </div>
  );
}
