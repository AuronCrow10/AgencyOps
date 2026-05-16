import { useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { Badge, Button, Card, Field, Textarea } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { AuditLog, Lead, Task, WebhookDelivery } from '../lib/domain';

type LeadDetail = Lead & {
  tasks: Task[];
  auditLogs: AuditLog[];
  webhookDeliveries: WebhookDelivery[];
};

export function LeadDetailPage() {
  const params = useParams();
  const taskForm = useForm<{ title: string; description: string }>({
    defaultValues: {
      title: '',
      description: ''
    }
  });

  const leadQuery = useQuery({
    queryKey: ['lead', params.id],
    queryFn: () => api.get<{ lead: LeadDetail }>(`/api/leads/${params.id}`)
  });

  const statusMutation = useMutation({
    mutationFn: (status: string) => api.patch(`/api/leads/${params.id}/status`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['lead', params.id] })
  });

  const rerunMutation = useMutation({
    mutationFn: () => api.post(`/api/leads/${params.id}/rerun-analysis`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['lead', params.id] })
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: { title: string; description: string }) =>
      api.post('/api/tasks', { ...payload, leadId: params.id }),
    onSuccess: () => {
      taskForm.reset();
      void queryClient.invalidateQueries({ queryKey: ['lead', params.id] });
    }
  });

  const lead = leadQuery.data?.lead;

  if (!lead) {
    return <div className="text-sm text-slate-500">Loading lead detail...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">{lead.company}</h1>
          <p className="mt-2 text-sm text-slate-500">
            {lead.name} - {lead.email} - {lead.serviceNeeded}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => statusMutation.mutate('contacted')}>
            Mark contacted
          </Button>
          <Button onClick={() => statusMutation.mutate('won')}>Mark won</Button>
          <Button variant="danger" onClick={() => statusMutation.mutate('lost')}>
            Mark lost
          </Button>
          <Button variant="ghost" onClick={() => rerunMutation.mutate()}>
            Rerun AI analysis
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Lead profile" className="xl:col-span-2">
          <div className="grid gap-4 md:grid-cols-2">
            <p>
              <span className="font-medium">Budget:</span> {lead.budgetRange}
            </p>
            <p>
              <span className="font-medium">Deadline:</span> {lead.deadline}
            </p>
            <p>
              <span className="font-medium">Source:</span> {lead.source}
            </p>
            <p>
              <span className="font-medium">Created:</span> {formatDate(lead.createdAt)}
            </p>
            <p className="md:col-span-2">
              <span className="font-medium">Website:</span> {lead.website ?? 'N/A'}
            </p>
            <p className="md:col-span-2 whitespace-pre-wrap text-sm text-slate-600">{lead.message}</p>
          </div>
        </Card>

        <Card title="Qualification">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Badge tone="info">{lead.status}</Badge>
              <Badge
                tone={lead.priority === 'urgent' ? 'danger' : lead.priority === 'high' ? 'warning' : 'neutral'}
              >
                {lead.priority}
              </Badge>
            </div>
            <p>
              <span className="font-medium">Score:</span> {lead.leadScore ?? 'N/A'}
            </p>
            <p>
              <span className="font-medium">Category:</span> {lead.category ?? 'Pending'}
            </p>
            <p>
              <span className="font-medium">Sentiment:</span> {lead.sentiment ?? 'Pending'}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="AI summary">
          <div className="space-y-4 text-sm text-slate-600">
            <p>{lead.summary ?? 'AI analysis not available yet.'}</p>
            <div>
              <p className="font-medium text-ink">Suggested reply</p>
              <p className="mt-1 whitespace-pre-wrap">{lead.suggestedReply ?? 'Not available yet.'}</p>
            </div>
            <div>
              <p className="font-medium text-ink">Recommended next step</p>
              <p className="mt-1 whitespace-pre-wrap">{lead.recommendedNextStep ?? 'Not available yet.'}</p>
            </div>
          </div>
        </Card>

        <Card title="Create task">
          <form
            className="space-y-4"
            onSubmit={taskForm.handleSubmit(async (values) => createTaskMutation.mutateAsync(values))}
          >
            <Field label="Title">
              <Textarea className="min-h-20" {...taskForm.register('title')} />
            </Field>
            <Field label="Description">
              <Textarea {...taskForm.register('description')} />
            </Field>
            <Button type="submit">Create task</Button>
          </form>
        </Card>
      </div>

      <Card title="Related tasks">
        <div className="space-y-4">
          {lead.tasks.map((task) => (
            <div key={task.id} className="rounded-2xl border border-slate-100 px-4 py-3">
              <p className="font-medium text-ink">{task.title}</p>
              <p className="mt-1 text-sm text-slate-500">{task.description}</p>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card title="Audit log">
          <div className="space-y-4">
            {lead.auditLogs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm">
                <p className="font-medium text-ink">{log.action}</p>
                <p className="mt-1 text-slate-500">{formatDate(log.createdAt)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Webhook deliveries">
          <div className="space-y-4">
            {lead.webhookDeliveries.map((delivery) => (
              <div key={delivery.id} className="rounded-2xl border border-slate-100 px-4 py-3 text-sm">
                <p className="font-medium text-ink">{delivery.webhookEndpoint.name}</p>
                <p className="mt-1 text-slate-500">
                  {delivery.eventType} - {delivery.status} - {delivery.attempts} attempts
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
