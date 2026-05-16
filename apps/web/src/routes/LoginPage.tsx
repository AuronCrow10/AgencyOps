import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema } from '@agencyops/shared';
import { Button, Card, Field, Input, PageShell } from '../components/ui';
import { useAuth } from '../hooks/useAuth';

type FormValues = {
  email: string;
  password: string;
};

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginMutation } = useAuth();
  const form = useForm<FormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'demo@agencyops.dev',
      password: 'ChangeMe123!'
    }
  });

  return (
    <PageShell>
      <div className="grid min-h-screen place-items-center px-6 py-16">
        <Card title="Login to AgencyOps" className="w-full max-w-xl">
          <form
            className="space-y-4"
            onSubmit={form.handleSubmit(async (values) => {
              await loginMutation.mutateAsync(values);
              const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
              void navigate(from);
            })}
          >
            <Field label="Email" error={form.formState.errors.email?.message}>
              <Input {...form.register('email')} />
            </Field>
            <Field label="Password" error={form.formState.errors.password?.message}>
              <Input type="password" {...form.register('password')} />
            </Field>
            {loginMutation.error ? (
              <p className="text-sm text-blush">{loginMutation.error.message}</p>
            ) : null}
            <div className="flex items-center justify-between">
              <Button type="submit" disabled={loginMutation.isPending}>
                {loginMutation.isPending ? 'Signing in...' : 'Login'}
              </Button>
              <Link to="/register" className="text-sm text-sea">
                Create organization
              </Link>
            </div>
          </form>
        </Card>
      </div>
    </PageShell>
  );
}
