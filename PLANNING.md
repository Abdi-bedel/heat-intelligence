# Heat Intelligence MVP — Technical Planning

*Tech-lead breakdown of `heat_intelligence_prd.md` v1.0 (May 2026).*
*Owner: Abdi · Status: implementation in progress (updated 2026-05-13) · Target ship: 2 weeks single engineer*

---

## 1. Analysis

**What this actually is:** a thin SaaS portal wrapped around a nightly aggregation job. Despite five "product layers," only the **Data layer** requires engineering. Everything else is consumer-app, Stripe config, or marketing narrative.

### Critical observations

- **Real build surface is small** — auth + 7 read endpoints + 1 cron + 1 single-page dashboard. The PRD's "2 weeks" estimate is realistic *if* the consumer app's event tables (`tile_view`, `tap_hours`, `tap_directions`, `tap_website`, check-ins) are already shipping. That's a hard external dependency.
- **The hardest thing isn't code, it's the empty-state UX.** PRD §3.7 is the actual product. Engineering risk is low; design honesty is the differentiator.
- **Data sparsity is structural, not a bug.** Peak hours / day-of-week need ≥4 weeks. Neighbourhood comparison needs ≥10 venues × ≥20 check-ins. These thresholds dictate the full pilot experience and must be enforced server-side (PRD §4.3).
- **Privacy boundary is the one thing that must be perfect at launch.** Venue ID from JWT only, never params (PRD §4.1). Cross-tenant leak = product death with Founding 50.

### Hidden dependencies the PRD does not fully scope

- Consumer-app event schema (`tile_view`, tap events) must exist before backend work starts.
- Neighbourhood + category taxonomy on venues must be canonical (powers PRD §3.4 D4).
- Stripe Founding-50 coupon/tag scheme (PRD §2.4) — narrative-only but must be set up at sale time.
- Admin tooling for founder-created venue logins (PRD §3.8) — not specified, but blocking. Even a CLI script counts.

### Risks to flag now

1. If consumer-app events aren't instrumented, "Day 1 hero data" (tile metrics) collapses to empty states everywhere — sales narrative breaks.
2. Neighbourhood comparison may *never* unlock for the first cohort if Founding 50 are spread across districts. Worth pre-computing simulated thresholds before launch.
3. Auth "rolled from scratch" (PRD §8.5) is acceptable but every hour spent here is hours not spent on the empty-state polish that sells the product. Strong recommend Clerk.

---

## 2. Epics

| # | Epic | Owner | Build? |
|---|------|-------|--------|
| **E1** | Verified Login Portal — frontend app (`venues.getheatapp.com`) | FE eng | Yes |
| **E2** | Venue API — auth-scoped read endpoints in Hono | BE eng | Yes |
| **E3** | Metrics Pipeline — nightly batch + `venue_metrics` table | BE eng | Yes |
| **E4** | Auth & Session — Supabase Auth, password reset | FE+BE | Yes |
| **E5** | Admin Tooling — founder-managed venue creation, manual cron trigger | BE | Yes (light) |
| **E6** | Observability — Sentry + Slack webhook on cron | BE | Yes (light) |
| **E7** | Consumer-app event source — internal API the cron calls (NOT direct table reads) | Cross-team | Dependency, not build |
| **E8** | Stripe price IDs (monthly €79 + yearly €49). Founding 50 is just a subscription tag on the €49 price — no coupon needed; counter reads from our `venues` table. | Ops / Abdi | Config, not build |
| **E9** | Visibility / Status / Programme / Promote layers | Consumer app + narrative | **No portal work** |
| **E10** | B2B Landing Page — `intelligence.getheatapp.com` (hero carousel, live ticker, pricing, FAQ, Founding 50 counter) | FE eng | **Yes — new scope from UX drop** |
| **E11** | Public API — unauthenticated endpoints for live-counts ticker + Founding 50 status | BE | Yes (light) |
| **E12** | Design System — `packages/ui` with Tailwind config + design tokens (Fraunces/Inter, coral/teal/amber/purple palette) | FE | Yes (light) |
| **E13** | Static "data journey" explainer page linked from Day 1 dashboard ribbon | FE / Abdi for copy | Yes (trivial) |

E7 is a hard upstream dependency on E2/E3. E8/E9 run in parallel and don't block engineering.

---

## 2.5 Stack — confirmed

- **Monorepo**: pnpm workspaces, fresh repo (decoupled from existing Heat consumer service)
- **Runtime**: Bun for the API, Node for Next.js (Vercel constraint)
- **Frontend**: Next.js (App Router) + Tailwind, hosted on Vercel
- **Backend**: Hono on Bun, deployed to Fly.io (separate Fly app from consumer Heat — different blast radius)
- **Auth**: Supabase Auth (replaces earlier Clerk recommendation — keeps everything in Supabase, gives RLS as defence in depth)
- **DB**: existing Supabase project; new `venue_metrics` table + RLS policies
- **Source events**: cron calls **consumer-app internal APIs** (not direct table reads — clean boundary, schema decoupled)
- **Charts**: Recharts for bars/areas, custom CSS for the 168-cell peak-hours grid
- **Email**: Resend SMTP plugged into Supabase Auth (free tier — 3k/month, branded `from venues@getheatapp.com`)

```
heat-intelligence/
├── apps/
│   ├── portal/          # venues.getheatapp.com (Next.js)
│   ├── marketing/       # intelligence.getheatapp.com (Next.js)
│   └── api/             # Hono on Bun — venue API + cron + public API
├── packages/
│   ├── contracts/       # types.ts + fixtures.ts (lifted from contracts/)
│   └── ui/              # Tailwind config, tokens, shared components
└── supabase/            # migrations + RLS for venue_metrics
```

---

## 3. Sprints (2-week MVP, single engineer)

Mapped to PRD's Day 1–14 sequence but reframed as outcomes per sprint half.

### Sprint 1A — Foundations (Days 1–4)

**Goal:** scaffolding done, pipeline producing real numbers locally.

- **E1.1** Next.js scaffold on Vercel, `venues.getheatapp.com` DNS, HTTPS
- **E2.1** Hono auth middleware + venue-scoped request context
- **E3.1** `venue_metrics` table schema (`venue_id`, `week_start`, `metric_key`, `value`, `computed_at`)
- **E3.2** Nightly cron skeleton + manual trigger endpoint (`POST /v1/admin/jobs/recompute-metrics`)
- **E3.3** First metric end-to-end: check-in count → table → endpoint → JSON
- **E7** Confirm consumer-app event tables exist and contain expected fields. **Block sprint if not.**

**Exit criteria:** one real venue's check-in count fetched via authenticated API call from local frontend.

### Sprint 1B — Data + Empty States (Days 5–9)

**Goal:** all four data points + tile metrics computed, empty-state contracts enforced server-side.

- **E3.4** Peak hours aggregation (168-cell grid, 4-week rolling)
- **E3.5** Day-of-week aggregation
- **E3.6** Neighbourhood comparison with threshold gating (≥10 venues × ≥20 check-ins) + category-only fallback
- **E3.7** Tile views + tap-throughs aggregation
- **E2.2** All 7 endpoints return either value or structured "not-available" payload (`{ status: 'pending', reason, threshold, progress }`)
- **E1.2** Dashboard layout per PRD §3.6: header, tile metrics, check-ins, neighbourhood line, peak hours, day-of-week, footer
- **E1.3** Empty-state components — every chart/number has a "why + when + progress" variant

**Exit criteria:** dashboard renders correctly for two test venues — one with 0 days of data, one with simulated 4-week data.

### Sprint 2A — Auth, Polish, Privacy Hardening (Days 10–13)

**Goal:** real venue can log in, privacy boundary verified, batch job hardened.

- **E4.1** Email + password login, password reset email, 30-day session
- **E4.2** Logout endpoint
- **E5.1** Admin script: create venue + login (founders run during in-person verification)
- **E6.1** Sentry wired in both apps
- **E6.2** Slack webhook on cron success/failure with venue counts
- **Privacy test pass**: scripted attempt to query other venues' data via every endpoint. Must all 401 / return own data only.
- **E2.3** Rate limiting (60 req/min/session)
- **E1.4** Visual polish using Heat Brand Language System tokens

**Exit criteria:** all PRD §7 acceptance checkboxes green.

### Sprint 2B — Buffer + Marketing site (Days 14–16, +2 days for E10/E11)

- End-to-end walkthrough as a real Founding-50 venue. Day 1 → Day 7 → Day 30 simulation.
- **E10** Port the 9-block landing page HTML into Next.js (`apps/marketing`), wire live ticker to `/v1/public/live-counts`, wire Founding 50 counter to `/v1/public/founding-50-status`, wire pricing toggle to Stripe price IDs.
- **E11** Implement the two public endpoints (cached, anonymous, no PII).
- **E13** Static `/data-journey` page on the portal (copy from Abdi).

**Note:** the original PRD-derived 14-day estimate did not include E10. With landing-page port + 2 public endpoints, realistic MVP = **16 working days** single-engineer, or back to 14 if E10 ships in parallel with E1.3 (see roadmap).

---

## 4. Technical Roadmap — Parallelisation View

```
Day:        1   2   3   4   5   6   7   8   9   10  11  12  13  14
            ─────────────────────────────────────────────────────────
TRACK A     [E1.1 scaffold ][E1.2 layout       ][E1.3 empty states ][E1.4 polish ]
(Frontend)                                       │                  │
                                                 │                  ├── needs E2.2 contract
                                                 └── needs E2 stubs

TRACK B     [E2.1 auth mw ][E2.2 endpoints + empty-state contracts        ][E2.3 rate limit]
(API)        │                  ▲
             │                  │ depends on E3.x outputs
             └── unblocks A early via mocked endpoints

TRACK C     [E3.1 schema][E3.2 cron][E3.3 check-ins][E3.4-3.7 aggregations         ]
(Pipeline)                                            │
                                                      └── feeds E2.2

TRACK D                                                          [E4 auth flow      ]
(Auth)                                                           ├── FE + BE in lockstep
                                                                  └── can start Day 9 once E2 stable

TRACK E     [E6.1 Sentry][                                       ][E6.2 Slack][E5.1 admin]
(Ops)        │ trivial, day 1
             └── parallel always

TRACK F                              [E12 design tokens][E10 landing page port             ][E11 public API]
(Marketing)                          │
                                      └── unblocked once E12 design tokens land (~Day 5)

DEPS:       E7 (consumer-app internal events API) — verify Day 1, blocks C if missing
            E8 (Stripe price IDs + Founding 50 counter) — Abdi, parallel; required before E10 ships
```

### Parallelisation rules

1. **Frontend and pipeline run in parallel from Day 1** if backend ships endpoint *contracts* (TypeScript types + mock responses) on Day 2. Highest-leverage move — don't serialise FE behind BE.
2. **Auth (E4) is deferred to Sprint 2A on purpose.** Hardcode a dev token for Sprints 1A/1B. Auth touches both stacks and is best done when the data path is stable.
3. **Empty-state UI (E1.3) is the critical-path item, not the cron.** Allocate the most calendar time here; every data point has 2 visual states (real / pending-with-progress).
4. **Privacy verification is a gate, not a task.** Sprint 2A doesn't exit until the scripted cross-tenant test passes.
5. **Consumer-app event schema (E7) must be confirmed Day 1.** If `tile_view` / `tap_*` aren't instrumented, escalate to Abdi same day.

---

## 5. Recommended Decisions for PRD §8 Open Questions

| Question | Recommendation | Why |
|---|---|---|
| Frontend stack | Next.js on Vercel | Matches PRD; fastest auth + edge story |
| DB access | Direct Supabase from Hono | No replica needed at this volume |
| Caching | None at MVP | Daily batch + 60 rpm cap = no hot path |
| Auth | **Clerk** | Saves ~1.5 days vs rolling; only cost is vendor lock — acceptable for a portal that may be replaced in Phase 2 anyway |
| Monitoring | Sentry + Slack webhook | As specced — sufficient |

---

## 6. Acceptance Gate (mirrors PRD §7)

- [ ] Verified venue can log in successfully
- [ ] Dashboard renders without errors for a venue with 0 days of data
- [ ] Dashboard renders without errors for a venue with 4+ weeks of data (simulated)
- [ ] Neighbourhood comparison shows empty state when threshold unmet
- [ ] Neighbourhood comparison shows real percentage when threshold met (simulated)
- [ ] Nightly batch job runs and produces sensible numbers
- [ ] Manual trigger endpoint works
- [ ] Tile views + tap-throughs show real data from Day 1
- [ ] Privacy: logged-in venue cannot query another venue's data via any endpoint
- [ ] `venues.getheatapp.com` accessible over HTTPS
- [ ] Password reset flow works end-to-end
- [ ] Marketing site loads at `intelligence.getheatapp.com`, hero carousel rotates, live ticker updates every 5s
- [ ] Founding 50 counter on the landing page reflects real Stripe state
- [ ] Pricing toggle switches monthly/yearly with correct Stripe price IDs
- [ ] Day 1 dashboard's "Read the data journey" link resolves to a real explainer page
- [ ] All four pending kinds return correct `estimated_unlock_at` (or null for neighbourhood density)

---

*Source PRD: `~/Downloads/heat_intelligence_prd.md`. Update this file when scope changes; do not relitigate decisions in PRD §9 during build.*
