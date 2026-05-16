FROM node:22-alpine AS base
WORKDIR /app
RUN corepack enable

FROM base AS deps
COPY . .
RUN pnpm install --frozen-lockfile=false

FROM deps AS build
RUN pnpm --filter @agencyops/api exec prisma generate
RUN pnpm --filter @agencyops/shared build
RUN pnpm --filter @agencyops/api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app /app
EXPOSE 4000
CMD ["pnpm", "--filter", "@agencyops/api", "start"]
