import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { Badge, Button, Card, EmptyState, Field, Input, Textarea } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { WebhookDelivery, WebhookEndpoint } from '../lib/domain';

export function WebhooksPage() {
  const form = useForm<{ name: string; url: string; eventTypes: string }>({
    defaultValues: {
      name: '',
      url: '',
      eventTypes: 'lead.created,lead.analyzed,lead.status_changed,task.created'
    }
  });

  const endpointsQuery = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get<{ items: WebhookEndpoint[] }>('/api/webhooks')
  });

  const deliveriesQuery = useQuery({
    queryKey: ['webhook-deliveries'],
    queryFn: () => api.get<{ items: WebhookDelivery[] }>('/api/webhook-deliveries?page=1&pageSize=20')
  });

  const createMutation = useMutation({
    mutationFn: (payload: { name: string; url: string; eventTypes: string }) =>
      api.post('/api/webhooks', {
        name: payload.name,
        url: payload.url,
        isActive: true,
        eventTypes: payload.eventTypes.split(',').map((value) => value.trim())
      }),
    onSuccess: () => {
      form.reset();
      void queryClient.invalidateQueries({ queryKey: ['webhooks'] });
    }
  });

  const toggleMutation = useMutation({
    mutationFn: (endpoint: WebhookEndpoint) =>
      api.patch(`/api/webhooks/${endpoint.id}`, { isActive: !endpoint.isActive }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['webhooks'] })
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => api.post(`/api/webhooks/${id}/test`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['webhook-deliveries'] })
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <Card title="Create webhook endpoint">
          <form className="space-y-4" onSubmit={form.handleSubmit(async (values) => createMutation.mutateAsync(values))}>
            <Field label="Name">
              <Input {...form.register('name')} />
            </Field>
            <Field label="URL">
              <Input {...form.register('url')} />
            </Field>
            <Field label="Events">
              <Textarea className="min-h-20" {...form.register('eventTypes')} />
            </Field>
            <Button type="submit">Create endpoint</Button>
          </form>
        </Card>

        <Card title="Endpoints">
          {endpointsQuery.data?.items.length ? (
            <div className="space-y-4">
              {endpointsQuery.data.items.map((endpoint) => (
                <div key={endpoint.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-ink">{endpoint.name}</p>
                      <p className="mt-1 text-sm text-slate-500">{endpoint.url}</p>
                      <p className="mt-2 text-xs text-slate-500">{endpoint.eventTypes.join(', ')}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge tone={endpoint.isActive ? 'success' : 'neutral'}>
                        {endpoint.isActive ? 'active' : 'disabled'}
                      </Badge>
                      <Button variant="secondary" className="px-3 py-1 text-xs" onClick={() => toggleMutation.mutate(endpoint)}>
                        {endpoint.isActive ? 'Disable' : 'Enable'}
                      </Button>
                      <Button className="px-3 py-1 text-xs" onClick={() => testMutation.mutate(endpoint.id)}>
                        Test
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No endpoints configured" description="Operators can add outbound automation targets here." />
          )}
        </Card>
      </div>

      <Card title="Recent deliveries">
        {deliveriesQuery.data?.items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Event</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Response</th>
                  <th className="pb-3">Created</th>
                </tr>
              </thead>
              <tbody>
                {deliveriesQuery.data.items.map((delivery) => (
                  <tr key={delivery.id} className="border-t border-slate-100">
                    <td className="py-3">{delivery.webhookEndpoint.name}</td>
                    <td className="py-3">{delivery.eventType}</td>
                    <td className="py-3">{delivery.status}</td>
                    <td className="py-3">{delivery.responseStatus ?? delivery.responseBody ?? 'Pending'}</td>
                    <td className="py-3">{formatDate(delivery.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No deliveries yet" description="Trigger a lead or task event to see webhook attempts." />
        )}
      </Card>
    </div>
  );
}
