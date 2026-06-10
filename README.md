# Heat Intelligence

Monorepo for the Verified Login Portal (`venues.getheatapp.com`), the B2B marketing site (`intelligence.getheatapp.com`), and the Hono API + cron that powers both.

**This is the B2B product.** The consumer side (mobile app, venue ingestion, public feeds, and the B2B *provider* surface) lives in the sister repository: `heat-app`.

See heat-app's:
- `docs/api/b2b_integration_requirements.md`
- `docs/api/openapi.yaml` § B2B Integration
- `backend/hono/src/services/b2b-link.ts` + B2B middleware/routes

The intended runtime boundary is narrow: this repo calls heat-app over the authenticated B2B HTTP surface (service tokens + `X-Heat-B2B-Client`) for check-ins, engagement events, live counts, etc. The nightly recompute (E7) is explicitly designed *not* to read consumer tables directly.

The onboarding/claims flow (venue claims, self-serve BetterAuth account creation for owners, status checks from consumer marketing) is now fully owned by this repo via the API (`/v1/claims/submit`, `/v1/claims/status`, admin claims routes). 

The consumer marketing site in the sister repo provides discovery UI and thin proxies only. No direct DB access from heat-app for claims.

Schema in `supabase/bridge/`. See heat-app `marketing/HEAT_INTELLIGENCE_BRIDGE.md` and root `HEAT-INTELLIGENCE.md`.

See [PLANNING.md](PLANNING.md) for the technical roadmap and [API_CONTRACT.md](API_CONTRACT.md) for the endpoint spec.

## Layout

```
heat-intelligence/
├── apps/
│   ├── portal/        venues.getheatapp.com — Next.js 15 (port 9000)
│   ├── marketing/     intelligence.getheatapp.com — Next.js 15 (port 9001)
│   └── api/           Hono on Bun (port 8787) — venue API + public API + cron
├── packages/
│   ├── contracts/     @heat/contracts — types + fixtures
│   └── ui/            @heat/ui — Tailwind preset + design tokens
└── supabase/
    └── migrations/    venue_metrics, venue_users, RLS
```

## Setup

```sh
pnpm install
cp apps/api/.env.example apps/api/.env
cp apps/portal/.env.example apps/portal/.env.local
cp apps/marketing/.env.example apps/marketing/.env.local
```

You'll need [Bun](https://bun.sh) installed for the API (`brew install oven-sh/bun/bun`).

## Run everything

```sh
pnpm dev
```

…runs all three apps in parallel:
- Portal: http://localhost:9000
- Marketing: http://localhost:9001
- API: http://localhost:8787

Or run individually: `pnpm dev:portal`, `pnpm dev:marketing`, `pnpm dev:api`.

## Trying it out

The portal uses fixtures from `@heat/contracts/fixtures` until the metrics pipeline is wired. Three preview scenarios are switchable via query string:

- http://localhost:9000/?scenario=day1 — fresh venue, only tile metrics populated
- http://localhost:9000/?scenario=week2 — 2 weeks in, patterns still locked
- http://localhost:9000/?scenario=month3 — full data, every endpoint ready

Hit the API directly:

```sh
curl http://localhost:8787/v1/public/live-counts | jq
curl -H 'Authorization: Bearer dev:0019' \
     http://localhost:8787/v1/venue/me/metrics/check-ins?scenario=month3 | jq
```

The `dev:` token shortcut is rejected when `NODE_ENV=production`.

## Operational scripts

```sh
# Create a venue + login (founder admin, in-person verification flow)
pnpm create-venue --name "Bar Marsella" --neighbourhood "El Born" \
  --category bar --email marsella@example.com --founding-50 19

# Force-recompute metrics for sales-call freshness or testing
pnpm recompute                          # all venues, trailing 8 weeks
pnpm recompute --venues uuid1,uuid2 --weeks 4

# Sprint 2A privacy gate — must pass before any deploy
pnpm privacy-gate
```

## Current known gaps

- Consumer events dependency (E7): the nightly recompute job needs `HEAT_APP_API_BASE_URL` + `HEAT_APP_B2B_TOKEN` (or legacy `CONSUMER_API_*`) so `apps/api/src/cron/sources.ts` can read real upstream events.
- API linting: `apps/api` currently reports `"(api lint not configured yet)"`; only portal + marketing run Next lint rules today.
- Portal + marketing lint warnings: both apps currently warn on `@next/next/no-page-custom-font` in `app/layout.tsx`.

## Deploy

- **API** → Fly.io. Bun runtime, mad region. `fly launch` once, then `fly deploy --config apps/api/fly.toml`.
- **Portal & marketing** → Vercel. Per-app `vercel.json` already in place; point each Vercel project at `apps/portal` or `apps/marketing` as the root, and run `pnpm install --frozen-lockfile` for installs.
- **Cron** → Fly scheduled machine running `bun run apps/api/scripts/recompute.ts` at 04:00 UTC daily (= 06:00 Madrid in standard time, 06:00 Madrid in BST gives 04:00 UTC also — close enough).
