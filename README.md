# AgencyOps

AgencyOps is a production-oriented full-stack application for agencies and small teams that need to capture inbound leads, qualify them with AI, route follow-up work, and operate from a single internal dashboard.

This repository is structured as a monorepo and demonstrates a realistic internal SaaS workflow rather than a toy CRUD demo.

## What AgencyOps Is

AgencyOps handles the agency intake lifecycle end to end:

- Public lead form or API/webhook intake
- Secure operator dashboard
- AI qualification, scoring, categorization, and response suggestions
- Task creation for follow-up work
- Webhook automation for downstream systems
- Notification abstraction for alerting
- Settings, API keys, and audit trails

## Business Problem

Most agencies lose time and revenue because inbound requests arrive through fragmented forms, inboxes, chats, or custom integrations. Operators manually sort, score, and route every request. That creates slow response times, inconsistent qualification, missed follow-ups, and weak operational visibility.

AgencyOps centralizes that flow into one internal system with automation at the intake and qualification layers.

## Features

- Public intake page at `/intake`
- API lead intake at `POST /api/public/leads`
- Cookie-based auth with `httpOnly` signed cookies
- Role model: `owner`, `admin`, `operator`
- Organization-aware lead pipeline
- AI provider abstraction with `mock` and `openai`
- BullMQ background jobs for lead analysis, webhook dispatch, and notifications
- Follow-up task generation for strong leads
- Configurable outbound webhooks with HMAC signatures and retry tracking
- Notification abstraction with mock, Resend, or SMTP modes
- Admin settings and hashed API key management
- Audit log stream for operational actions
- Docker Compose for local and production-like deployment

## Architecture

```text
agencyops/
  apps/
    api/      Express + TypeScript + Prisma + BullMQ
    web/      React + Vite + TypeScript + Tailwind
  packages/
    shared/   Shared schemas and types
```

Portfolio diagrams: see [docs/agencyops-architecture.md](docs/agencyops-architecture.md), [docs/agencyops-lead-pipeline.md](docs/agencyops-lead-pipeline.md), and the standalone SVG at [docs/agencyops-architecture.svg](docs/agencyops-architecture.svg).

### Backend

- Express API with thin controllers and service-oriented business logic
- Prisma for PostgreSQL access
- Redis + BullMQ for background workers
- Zod validation at runtime
- Pino logging
- Request IDs and centralized error handling

### Frontend

- React + Vite + TypeScript
- React Router for app routing
- TanStack Query for server state
- React Hook Form + Zod for typed forms
- Tailwind CSS for a minimal but polished internal-tool UI

## Tech Stack

- Monorepo: pnpm workspaces
- Backend: Node.js, Express, TypeScript
- Frontend: React, Vite, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Queue / cache: Redis, BullMQ
- Validation: Zod
- Logging: Pino
- Auth: signed `httpOnly` cookies with JWT access + refresh flow
- Password hashing: argon2
- Testing: Vitest
- Linting / formatting: ESLint, Prettier
- Infra: Docker Compose, designed to run behind a host reverse proxy

## Security Notes

- Passwords are hashed with argon2id
- Auth tokens are stored only in signed `httpOnly` cookies
- Cookies use `sameSite=lax` and `secure` in production
- CORS is restricted by explicit allowlist from env
- Request payloads are size-limited
- Request bodies are validated with Zod
- API keys are hashed before storage
- Webhook secrets are encrypted at rest with `APP_ENCRYPTION_KEY`
- Errors returned to clients are sanitized
- Detailed failures are logged server-side only

### CSRF note

This implementation relies on a combination of:

- `httpOnly` cookies
- `sameSite=lax`
- explicit CORS origin allowlist
- credentialed requests only from approved origins

That is a reasonable baseline for same-site SPA usage. For higher-risk deployments, add explicit CSRF tokens or same-origin deployment behind a single domain.

## Local Setup

### Option 1: Docker-first

1. Copy the environment file:

```bash
cp .env.example .env
```

2. Start the stack:

```bash
docker compose up --build
```

3. Seed demo data:

```bash
docker compose exec api pnpm --filter @agencyops/api db:seed
```

### Option 2: Run app code locally, infra in Docker

1. Install dependencies:

```bash
pnpm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

4. Run migrations and seed data:

```bash
pnpm db:migrate
pnpm db:seed
```

5. Start the apps:

```bash
pnpm --filter @agencyops/api dev
pnpm --filter @agencyops/api worker
pnpm --filter @agencyops/web dev
```

## Docker Setup

### Local stack

```bash
docker compose up --build
```

Services:

- `postgres`
- `redis`
- `api`
- `worker`
- `web`

### Production-like stack

Use `.env.production.example` as the production template for the root `.env`.
The `POSTGRES_PASSWORD` value must match the password embedded in `DATABASE_URL`;
use URL-safe characters or URL-encode special characters.

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Services:

- `postgres`
- `redis`
- `api`
- `worker`
- `web`

In production-like mode, PostgreSQL and Redis stay private to the Compose network.
The API and web containers bind only to localhost on the VPS:

- API: `127.0.0.1:${AGENCYOPS_API_PORT:-4000}`
- Web: `127.0.0.1:${AGENCYOPS_WEB_PORT:-5173}`

Use the VPS-level Nginx or Caddy instance to terminate HTTPS and route the
AgencyOps domain to those loopback ports. Route `/api/` to the API port and all
other paths to the web port.

Example Nginx server block:

```nginx
server {
  listen 80;
  server_name agencyops.example.com;

  location /api/ {
    proxy_pass http://127.0.0.1:4000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    proxy_pass http://127.0.0.1:5173;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

## Environment Variables

Main variables in root `.env.example` and `.env.production.example`:

- `NODE_ENV`
- `PORT`
- `AGENCYOPS_API_PORT`
- `AGENCYOPS_WEB_PORT`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `REDIS_URL`
- `WEB_APP_URL`
- `API_URL`
- `CORS_ORIGIN`
- `VITE_API_URL`
- `VITE_PUBLIC_ORGANIZATION_SLUG`
- `COOKIE_SECRET`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `APP_ENCRYPTION_KEY`
- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `EMAIL_PROVIDER`
- `RESEND_API_KEY`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `NOTIFICATION_FROM_EMAIL`
- `WEBHOOK_TIMEOUT_MS`
- `LOG_LEVEL`

The API validates its runtime environment on boot and fails fast if required values are missing or invalid.

## Database Migrations

Migration files are included in `apps/api/prisma/migrations`.

Run migrations with:

```bash
pnpm db:migrate
```

Or inside Docker:

```bash
docker compose exec api pnpm --filter @agencyops/api prisma migrate deploy
```

## Seed Data

The seed script creates:

- organization: `Northstar Digital Agency`
- demo owner user
- 10 realistic sample leads
- related tasks
- audit logs
- one mock webhook endpoint
- one demo API key

Run:

```bash
pnpm db:seed
```

The seed script refuses to run when `NODE_ENV=production`.

## Demo Credentials

Seeded demo credentials:

- Email: `demo@agencyops.dev`
- Password: `ChangeMe123!`

Warning: never use demo credentials or demo seed data in production.

## API Overview

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Public

- `POST /api/public/leads`

### Leads

- `GET /api/leads/dashboard`
- `GET /api/leads`
- `GET /api/leads/:id`
- `PATCH /api/leads/:id/status`
- `POST /api/leads/:id/rerun-analysis`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`

### Webhooks

- `GET /api/webhooks`
- `POST /api/webhooks`
- `PATCH /api/webhooks/:id`
- `DELETE /api/webhooks/:id`
- `POST /api/webhooks/:id/test`
- `GET /api/webhook-deliveries`

### Settings and Admin

- `GET /api/settings`
- `PATCH /api/settings`
- `GET /api/audit-logs`
- `GET /api/api-keys`
- `POST /api/api-keys`
- `DELETE /api/api-keys/:id`
- `GET /api/users`

## Webhook Signing

Outbound webhook payloads are signed with HMAC SHA-256.

Header:

```text
X-AgencyOps-Signature: sha256=<hex_digest>
```

Signing input:

- raw JSON payload string
- endpoint secret

Webhook deliveries are stored with:

- event type
- payload
- delivery status
- response status
- response body
- retry attempts
- next retry timestamp

## AI Provider Configuration

### Mock mode

Set:

```env
AI_PROVIDER=mock
```

This is the default and keeps the app fully usable without external AI credentials.

### OpenAI mode

Set:

```env
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4.1-mini
```

The API validates OpenAI configuration at startup when this mode is enabled.

## Commands

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm db:migrate
pnpm db:seed
```

## Health Endpoints

- `GET /api/health`
- `GET /api/ready`

`/api/health` checks API, database, and Redis connectivity.

## Screenshots

Placeholder section for portfolio screenshots:

- Home page
- Public intake form
- Dashboard overview
- Leads table
- Lead detail view
- Webhooks and settings

## What This Project Demonstrates

- End-to-end lead operations workflow design
- Production-minded TypeScript backend architecture
- Secure cookie-based auth without `localStorage`
- Background job orchestration with retries
- AI abstraction that degrades cleanly to a mock provider
- Multi-tenant operational patterns for agencies
- Realistic internal tool frontend composition

## What Is Mocked vs Production-Ready

### Mocked by default

- AI provider when `AI_PROVIDER=mock`
- Email delivery when `EMAIL_PROVIDER=mock`
- Demo intake organization routing via `VITE_PUBLIC_ORGANIZATION_SLUG`

### Production-ready patterns already present

- Prisma schema and migration structure
- Typed validation
- secure cookie auth flow
- hashed passwords and hashed API keys
- encrypted webhook secrets
- worker-based asynchronous processing
- delivery retries and audit logs
- containerized deployment topology

### Production improvements still recommended

- Add explicit CSRF tokens for stricter browser threat models
- Encrypt all third-party credentials with KMS or platform secrets tooling
- Add metrics, tracing, and centralized error tracking
- Add richer authorization checks and session management UX
- Add stronger test coverage for controllers and worker flows
- Add organization-specific public intake publishing instead of demo slug config

## Production Deployment Checklist

- Set strong unique secrets for cookies, JWTs, and encryption
- Use managed PostgreSQL
- Use managed Redis
- Configure HTTPS
- Ensure cookies are `secure`
- Restrict `CORS_ORIGIN` to trusted domains
- Run Prisma migrations before traffic cutover
- Configure database backups
- Configure monitoring and error tracking
- Configure a real email provider
- Configure a real AI provider if required
- Tune rate limits
- Review operational logs
- Remove or disable demo seed credentials
- Put the app behind a hardened reverse proxy or load balancer
- Store secrets in your platform secret manager

## Suggested Next Improvements

1. Add organization-specific public intake pages and embeddable forms.
2. Add richer task workflows, assignments, and SLA tracking.
3. Add inbound email capture and CRM sync integrations.
4. Add analytics over lead conversion by source and category.
5. Add stronger E2E and integration tests with containerized test services.
