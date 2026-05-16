import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../components/ui';
import { classNames } from '../lib/utils';

const navigation = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/leads', label: 'Leads' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/webhooks', label: 'Webhooks' },
  { to: '/settings', label: 'Settings' },
  { to: '/audit-logs', label: 'Audit Logs' }
];

export function AppLayout() {
  const navigate = useNavigate();
  const { user, logoutMutation } = useAuth();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[280px_1fr]">
      <aside className="border-b border-slate-200 bg-ink px-6 py-8 text-white lg:border-b-0 lg:border-r">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-teal-200">AgencyOps</p>
          <h1 className="mt-2 text-2xl font-semibold">{user?.organization.name}</h1>
          <p className="mt-2 text-sm text-slate-300">AI-powered agency intake, qualification and operations.</p>
        </div>

        <nav className="mt-8 flex flex-col gap-2">
          {navigation.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                classNames(
                  'rounded-2xl px-4 py-3 text-sm transition',
                  isActive ? 'bg-white text-ink' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white/85 px-6 py-5 shadow-panel sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Signed in as {user?.name}</p>
            <p className="text-sm font-medium text-slate-700">
              {user?.email} - {user?.role}
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={async () => {
              await logoutMutation.mutateAsync();
              void navigate('/login');
            }}
          >
            Logout
          </Button>
        </header>
        <Outlet />
      </main>
    </div>
  );
}
