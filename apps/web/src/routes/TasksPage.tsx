import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { queryClient } from '../lib/queryClient';
import { Badge, Button, Card, EmptyState, Field, Input, Select, Textarea } from '../components/ui';
import { formatDate } from '../lib/utils';
import type { Task } from '../lib/domain';

export function TasksPage() {
  const taskForm = useForm<{ title: string; description: string; assignedToId?: string }>({
    defaultValues: {
      title: '',
      description: '',
      assignedToId: ''
    }
  });

  const tasksQuery = useQuery({
    queryKey: ['tasks'],
    queryFn: () => api.get<{ items: Task[] }>('/api/tasks?page=1&pageSize=50')
  });

  const usersQuery = useQuery({
    queryKey: ['users'],
    queryFn: () => api.get<{ items: Array<{ id: string; name: string }> }>('/api/users')
  });

  const createTaskMutation = useMutation({
    mutationFn: (payload: { title: string; description: string; assignedToId?: string }) =>
      api.post('/api/tasks', {
        ...payload,
        assignedToId: payload.assignedToId || undefined
      }),
    onSuccess: () => {
      taskForm.reset();
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.patch(`/api/tasks/${id}`, { status }),
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['tasks'] })
  });

  const tasks = tasksQuery.data?.items ?? [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card title="Tasks">
          {tasks.length ? (
            <div className="space-y-4">
              {tasks.map((task) => (
                <div key={task.id} className="rounded-2xl border border-slate-100 px-4 py-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-ink">{task.title}</p>
                      <p className="mt-1 text-sm text-slate-500">{task.description}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {task.lead ? `Linked lead: ${task.lead.company}` : 'General task'} - due{' '}
                        {formatDate(task.dueAt)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        tone={
                          task.status === 'completed'
                            ? 'success'
                            : task.status === 'canceled'
                              ? 'danger'
                              : 'info'
                        }
                      >
                        {task.status}
                      </Badge>
                      {task.status !== 'completed' ? (
                        <Button
                          variant="secondary"
                          className="px-3 py-1 text-xs"
                          onClick={() =>
                            updateTaskMutation.mutate({ id: task.id, status: 'completed' })
                          }
                        >
                          Complete
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No tasks yet"
              description="Create follow-up work for operators or link tasks to leads."
            />
          )}
        </Card>

        <Card title="Create task">
          <form
            className="space-y-4"
            onSubmit={taskForm.handleSubmit(async (values) => createTaskMutation.mutateAsync(values))}
          >
            <Field label="Title">
              <Input {...taskForm.register('title')} />
            </Field>
            <Field label="Description">
              <Textarea {...taskForm.register('description')} />
            </Field>
            <Field label="Assign to">
              <Select {...taskForm.register('assignedToId')}>
                <option value="">Unassigned</option>
                {usersQuery.data?.items.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit">Create task</Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
