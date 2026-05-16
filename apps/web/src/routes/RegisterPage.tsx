import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema } from '@agencyops/shared';
import { Button, Card, Field, Input, PageShell } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

type FormValues = {
  organizationName: string;
  name: string;
  email: string;
  password: string;
};

export function RegisterPage() {
  const navigate = useNavigate();
  const { registerMutation } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      organizationName: 'Northstar Digital Agency',
      name: 'Demo Owner',
      email: 'demo@agencyops.dev',
      password: 'ChangeMe123!'
    }
  });

  return (
    <PageShell>
      <div className="grid min-h-screen place-items-center px-6 py-16">
        <Card title="Register your organization" className="w-full max-w-2xl">
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit(async (values) => {
              await registerMutation.mutateAsync(values);
              void navigate('/dashboard');
            })}
          >
            <div className="sm:col-span-2">
              <Field label="Organization name" error={form.formState.errors.organizationName?.message}>
                <Input {...form.register('organizationName')} />
              </Field>
            </div>
            <Field label="Your name" error={form.formState.errors.name?.message}>
              <Input {...form.register('name')} />
            </Field>
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input {...form.register('email')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Password" error={form.formState.errors.password?.message}>
                <Input type="password" {...form.register('password')} />
              </Field>
            </div>
            {registerMutation.error ? (
              <p className="sm:col-span-2 text-sm text-blush">{registerMutation.error.message}</p>
            ) : null}
            <div className="sm:col-span-2 flex items-center justify-between">
              <Button type="submit" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? 'Creating account...' : 'Register'}
              </Button>
              <Link to="/login" className="text-sm text-sea">
                Back to login
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
