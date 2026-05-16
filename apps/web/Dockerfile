FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
ARG VITE_API_URL=http://localhost:4000
ARG VITE_PUBLIC_ORGANIZATION_SLUG=northstar-digital-agency
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_PUBLIC_ORGANIZATION_SLUG=$VITE_PUBLIC_ORGANIZATION_SLUG
RUN pnpm --filter @agencyops/shared build
RUN pnpm --filter @agencyops/web build

FROM node:22-alpine AS runner
WORKDIR /app
RUN npm install -g serve
COPY --from=build /app/apps/web/dist ./dist
EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
