import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { buildQueryString } from '../lib/query';
import { Badge, Button, Card, EmptyState, Input, Select } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { Lead } from '../lib/domain';

function priorityTone(priority: Lead['priority']) {
  return priority === 'urgent' ? 'danger' : priority === 'high' ? 'warning' : priority === 'medium' ? 'info' : 'neutral';
}

export function LeadsPage() {
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    category: ''
  });

  const leadsQuery = useQuery({
    queryKey: ['leads', filters],
    queryFn: () => {
      const query = buildQueryString({
        page: '1',
        pageSize: '20',
        search: filters.search,
        status: filters.status,
        priority: filters.priority,
        category: filters.category
      });

      return api.get<{ items: Lead[]; pagination: { total: number } }>(`/api/leads?${query}`);
    }
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/leads/${id}/status`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['leads'] })
  });

  const items = leadsQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="grid flex-1 gap-3 md:grid-cols-4">
          <Input
            placeholder="Search leads"
            value={filters.search}
            onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
          />
          <Select value={filters.status} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
            <option value="">All statuses</option>
            {['new', 'analyzing', 'qualified', 'contacted', 'won', 'lost', 'archived'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select value={filters.priority} onChange={(event) => setFilters((current) => ({ ...current, priority: event.target.value }))}>
            <option value="">All priorities</option>
            {['low', 'medium', 'high', 'urgent'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
          <Select value={filters.category} onChange={(event) => setFilters((current) => ({ ...current, category: event.target.value }))}>
            <option value="">All categories</option>
            {['sales_lead', 'support_request', 'partnership', 'spam', 'other'].map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Card title="Lead pipeline">
        {items.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-slate-500">
                <tr>
                  <th className="pb-3">Company</th>
                  <th className="pb-3">Service</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Score</th>
                  <th className="pb-3">Created</th>
                  <th className="pb-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((lead) => (
                  <tr key={lead.id} className="border-t border-slate-100 align-top">
                    <td className="py-4">
                      <Link className="font-medium text-sea" to={`/leads/${lead.id}`}>
                        {lead.company}
                      </Link>
                      <p className="mt-1 text-xs text-slate-500">{lead.name}</p>
                    </td>
                    <td className="py-4">{lead.serviceNeeded}</td>
                    <td className="py-4">{lead.status}</td>
                    <td className="py-4">
                      <Badge tone={priorityTone(lead.priority)}>{lead.priority}</Badge>
                    </td>
                    <td className="py-4">{lead.leadScore ?? 'N/A'}</td>
                    <td className="py-4">{formatDate(lead.createdAt)}</td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {lead.status !== 'contacted' ? (
                          <Button
                            variant="secondary"
                            className="px-3 py-1 text-xs"
                            onClick={() => statusMutation.mutate({ id: lead.id, status: 'contacted' })}
                          >
                            Mark contacted
                          </Button>
                        ) : null}
                        {lead.status !== 'won' ? (
                          <Button
                            className="px-3 py-1 text-xs"
                            onClick={() => statusMutation.mutate({ id: lead.id, status: 'won' })}
                          >
                            Mark won
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState title="No leads found" description="Adjust your filters or submit a new demo intake." />
        )}
      </Card>
    </div>
  );
}
