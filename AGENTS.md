# heat-intelligence — repo rules for AI agents

This is the **B2B side** of Heat (venues.getheatapp.com portal + intelligence.getheatapp.com marketing + supporting Hono API + nightly recompute).

The consumer side (Flutter app, main venue catalog, ingestion pipelines, public consumer APIs, and the B2B *provider* endpoints) lives in the **sister repository** `heat-app`.

## Cross-repo relationship (read this)

- **Primary integration (clean boundary)**: This codebase calls heat-app over the B2B service-token HTTP surface (`/b2b/v1/*`).
  - Uses `HEAT_APP_B2B_TOKEN` (or legacy `CONSUMER_API_INTERNAL_TOKEN`) + `HEAT_APP_API_BASE_URL`.
  - All data reads for check-ins, engagement events, live-counts go through this.
  - The `b2b_venue_link` table + resolution lives in heat-app. Never guess consumer `locations.id`.
- **Onboarding bridge (pragmatic coupling)**: Venue claims, "log in from consumer marketing", and admin review of claims are implemented with direct Postgres + BetterAuth against *this* DB from code that lives in heat-app (`marketing/app/api/venue-claims/*`, `apps/admin/lib/heat-intelligence/db.ts`, etc.).
  - The SQL for the bridge tables lives here: `supabase/bridge/`.
  - See heat-app `marketing/README.md` (Heat Intelligence Postgres setup) for current run instructions.
- When the B2B contract or link table changes, coordinate with the heat-app side (docs/api/ in that repo).
- Never put heat-app internal credentials or the consumer DB URL into this repo.

See also:
- heat-app `docs/api/b2b_integration_requirements.md`
- heat-app `docs/api/openapi.yaml` (B2B section)
- heat-app `backend/hono/src/services/b2b-link.ts`
- This repo's `PLANNING.md` and `API_CONTRACT.md`

## ⛔ External / paid calls

Most paid third-party work (Outscraper, Google Places, Foursquare, Yelp, Gemini for venue ingestion, etc.) lives **in the heat-app sister repo**.

In this repo the main external dependency for data is the heat-app B2B surface (already authenticated + rate-limited on their side).

If you ever add a new paid integration here:
1. Add it to a table in this file (or link to heat-app's).
2. Add an env kill-switch (default OFF).
3. Add usage logging.
4. Get explicit confirmation before any backfill or broad run.

## What's safe to run freely

- `pnpm install`, `pnpm dev`, `pnpm typecheck`, `pnpm lint`, `pnpm build`
- Local runs of the three apps (portal 9000, marketing 9001, api 8787)
- `bun run apps/api/scripts/recompute.ts` (will use stubs or the configured B2B token)
- `bun run apps/api/scripts/privacy-gate-test.ts`
- `bun run apps/api/scripts/create-venue.ts`
- Reading/writing this repo's own Supabase (the intelligence project)
- TypeScript / Next / Hono work

## Operational scripts (from package.json)

```sh
pnpm create-venue --name "..." --neighbourhood "..." --category bar --email ... --founding-50 19
pnpm recompute
pnpm recompute --venues uuid1,uuid2 --weeks 4
pnpm privacy-gate
```

## Layout reminders for agents

```
heat-intelligence/
├── apps/
│   ├── portal/        # venues.getheatapp.com (Next.js + BetterAuth + Supabase client)
│   ├── marketing/     # intelligence.getheatapp.com (Next.js landing + pricing)
│   └── api/           # Hono/Bun (auth, /v1/venue/*, public live-counts, cron jobs)
├── packages/
│   ├── contracts/     # @heat/contracts (types + scenario fixtures)
│   └── ui/            # @heat/ui (tokens + Tailwind preset)
└── supabase/
    └── migrations/    # Core tables (venues, venue_users, venue_metrics + RLS)
    └── bridge/        # Claims/mirror + BetterAuth schema for the onboarding bridge (owned here)
```

## Other rules

- The portal must always scope by the authenticated venue (from JWT / venue_users). Never leak cross-tenant data.
- Empty states and threshold gating are product, not optional.
- When touching recompute or sources.ts, remember E7 (consumer events) is a hard dependency implemented as an HTTP call into the sister repo.
- Prefer updating `API_CONTRACT.md` and the openapi in the sister repo when endpoint behavior changes.
- Local dev uses the `.env*` copies; never commit real tokens or the prod B2B token.

When in doubt about a change that crosses the consumer / B2B boundary, describe the impact on the other repo and the integration contract before implementing.
