import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { HomePage } from './routes/HomePage';
import { IntakePage } from './routes/IntakePage';
import { LoginPage } from './routes/LoginPage';
import { RegisterPage } from './routes/RegisterPage';
import { DashboardPage } from './routes/DashboardPage';
import { LeadsPage } from './routes/LeadsPage';
import { LeadDetailPage } from './routes/LeadDetailPage';
import { TasksPage } from './routes/TasksPage';
import { WebhooksPage } from './routes/WebhooksPage';
import { SettingsPage } from './routes/SettingsPage';
import { AuditLogsPage } from './routes/AuditLogsPage';
import { ProtectedRoute } from './routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />
  },
  {
    path: '/intake',
    element: <IntakePage />
  },
  {
    path: '/login',
    element: <LoginPage />
  },
  {
    path: '/register',
    element: <RegisterPage />
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: '/dashboard',
            element: <DashboardPage />
          },
          {
            path: '/leads',
            element: <LeadsPage />
          },
          {
            path: '/leads/:id',
            element: <LeadDetailPage />
          },
          {
            path: '/tasks',
            element: <TasksPage />
          },
          {
            path: '/webhooks',
            element: <WebhooksPage />
          },
          {
            path: '/settings',
            element: <SettingsPage />
          },
          {
            path: '/audit-logs',
            element: <AuditLogsPage />
          }
        ]
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/" replace />
  }
]);
