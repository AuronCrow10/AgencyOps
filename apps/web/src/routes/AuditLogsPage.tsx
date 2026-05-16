import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { buildQueryString } from '../lib/query';
import { Card, EmptyState, Input } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { AuditLog } from '../lib/domain';

export function AuditLogsPage() {
  const [action, setAction] = useState('');
  const [entityType, setEntityType] = useState('');

  const auditQuery = useQuery({
    queryKey: ['audit-logs', action, entityType],
    queryFn: () => {
      const query = buildQueryString({
        page: '1',
        pageSize: '50',
        action,
        entityType
      });

      return api.get<{ items: AuditLog[] }>(`/api/audit-logs?${query}`);
    }
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Input placeholder="Filter by action" value={action} onChange={(event) => setAction(event.target.value)} />
        <Input
          placeholder="Filter by entity type"
          value={entityType}
          onChange={(event) => setEntityType(event.target.value)}
        />
      </div>

      <Card title="Audit trail">
        {auditQuery.data?.items.length ? (
          <div className="space-y-4">
            {auditQuery.data.items.map((log) => (
              <div key={log.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-ink">{log.action}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {log.entityType}
                      {log.entityId ? ` - ${log.entityId}` : ''}
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">{formatDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No audit logs found"
            description="As operators use the system, state changes will be recorded here."
          />
        )}
      </Card>
    </div>
  );
}
