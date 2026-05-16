import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { Button, Card, Field, Input, Select } from '../components/ui';

export function SettingsPage() {
  const settingsQuery = useQuery({
    queryKey: ['settings'],
    queryFn: () =>
      api.get<{
        settings: {
          id: string;
          name: string;
          notificationSetting?: {
            emailNotificationsEnabled: boolean;
            notifyEmail?: string | null;
          } | null;
        };
      }>('/api/settings')
  });

  const apiKeysQuery = useQuery({
    queryKey: ['api-keys'],
    queryFn: () => api.get<{ items: Array<{ id: string; name: string; createdAt: string; revokedAt?: string | null }> }>('/api/api-keys')
  });

  const form = useForm({
    values: {
      organizationName: settingsQuery.data?.settings.name ?? '',
      emailNotificationsEnabled: settingsQuery.data?.settings.notificationSetting?.emailNotificationsEnabled ? 'true' : 'false',
      notifyEmail: settingsQuery.data?.settings.notificationSetting?.notifyEmail ?? ''
    }
  });

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: { organizationName: string; emailNotificationsEnabled: string; notifyEmail: string }) =>
      api.patch('/api/settings', {
        organizationName: payload.organizationName,
        emailNotificationsEnabled: payload.emailNotificationsEnabled === 'true',
        notifyEmail: payload.notifyEmail || null
      }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['settings'] })
  });

  const createApiKeyMutation = useMutation({
    mutationFn: (name: string) => api.post<{ rawKey: string; apiKey: { id: string } }>('/api/api-keys', { name }),
    onSuccess: (result) => {
      window.alert(`API key created. Copy it now:\n\n${result.rawKey}`);
      void queryClient.invalidateQueries({ queryKey: ['api-keys'] });
    }
  });

  const revokeApiKeyMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/api-keys/${id}`),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['api-keys'] })
  });

  return (
    <div className="space-y-6">
      <Card title="Organization settings">
        <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(async (values) => updateSettingsMutation.mutateAsync(values))}>
          <Field label="Organization name">
            <Input {...form.register('organizationName')} />
          </Field>
          <Field label="Email notifications">
            <Select {...form.register('emailNotificationsEnabled')}>
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Notification email">
              <Input {...form.register('notifyEmail')} />
            </Field>
          </div>
          <div className="md:col-span-2">
            <Button type="submit">Save settings</Button>
          </div>
        </form>
      </Card>

      <Card title="API keys" action={<Button variant="secondary" onClick={() => {
        const name = window.prompt('API key name');
        if (name) {
          createApiKeyMutation.mutate(name);
        }
      }}>Create API key</Button>}>
        <div className="space-y-4">
          {apiKeysQuery.data?.items.map((apiKey) => (
            <div key={apiKey.id} className="flex items-center justify-between rounded-2xl border border-slate-100 px-4 py-3">
              <div>
                <p className="font-medium text-ink">{apiKey.name}</p>
                <p className="text-sm text-slate-500">{apiKey.revokedAt ? 'Revoked' : 'Active'}</p>
              </div>
              {!apiKey.revokedAt ? (
                <Button variant="danger" className="px-3 py-1 text-xs" onClick={() => revokeApiKeyMutation.mutate(apiKey.id)}>
                  Revoke
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
