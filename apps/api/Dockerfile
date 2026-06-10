FROM oven/bun:1.1.30-alpine AS base

WORKDIR /app

# Copy workspace manifests first for cached installs
COPY package.json pnpm-lock.yaml* pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/contracts/package.json ./packages/contracts/

# Use bun for everything — no pnpm in the runtime image
COPY packages/contracts ./packages/contracts
COPY apps/api ./apps/api

RUN bun install --cwd /app/apps/api

WORKDIR /app/apps/api
EXPOSE 8787

CMD ["bun", "run", "src/index.ts"]
