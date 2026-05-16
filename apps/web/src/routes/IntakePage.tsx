import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { publicLeadInputSchema } from '@agencyops/shared';
import { api } from '../lib/api';
import { Button, Card, Field, Input, PageShell, Textarea } from '../components/ui';

type FormValues = {
  name: string;
  email: string;
  company: string;
  website?: string;
  budgetRange: string;
  serviceNeeded: string;
  deadline: string;
  message: string;
};

export function IntakePage() {
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(publicLeadInputSchema),
    defaultValues: {
      name: '',
      email: '',
      company: '',
      website: '',
      budgetRange: '',
      serviceNeeded: '',
      deadline: '',
      message: ''
    }
  });

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-6 py-16">
        <Card title="Submit a demo intake">
          {submitted ? (
            <div className="rounded-3xl bg-teal-50 p-6 text-teal-900">
              Thanks. Your request was captured and queued for AI analysis.
            </div>
          ) : (
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={form.handleSubmit(async (values) => {
                await api.post('/api/public/leads', {
                  ...values,
                  organizationSlug:
                    (import.meta.env.VITE_PUBLIC_ORGANIZATION_SLUG as string | undefined) ??
                    'northstar-digital-agency'
                });
                setSubmitted(true);
                form.reset();
              })}
            >
              <Field label="Name" error={form.formState.errors.name?.message}>
                <Input {...form.register('name')} />
              </Field>
              <Field label="Email" error={form.formState.errors.email?.message}>
                <Input {...form.register('email')} />
              </Field>
              <Field label="Company" error={form.formState.errors.company?.message}>
                <Input {...form.register('company')} />
              </Field>
              <Field label="Website" error={form.formState.errors.website?.message}>
                <Input {...form.register('website')} />
              </Field>
              <Field label="Budget range" error={form.formState.errors.budgetRange?.message}>
                <Input {...form.register('budgetRange')} />
              </Field>
              <Field label="Service needed" error={form.formState.errors.serviceNeeded?.message}>
                <Input {...form.register('serviceNeeded')} />
              </Field>
              <Field label="Deadline" error={form.formState.errors.deadline?.message}>
                <Input {...form.register('deadline')} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Project details" error={form.formState.errors.message?.message}>
                  <Textarea {...form.register('message')} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit">Submit intake</Button>
              </div>
            </form>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
