-- Heat Intelligence MVP — initial schema
-- Sprint 1A: tables + RLS so the API can scope queries by venue from Day 1.
--
-- Two tables:
--   venues          canonical venue record (taxonomy, neighbourhood, status)
--   venue_users     mapping from Supabase auth user → venue
--   venue_metrics   nightly aggregation output keyed by (venue_id, week_start, metric_key)

create extension if not exists "uuid-ossp";

-- ─── venues ──────────────────────────────────────────────────────────────────
create table if not exists public.venues (
  id                  uuid primary key default uuid_generate_v4(),
  display_short_id    text not null unique,                 -- e.g. "0019"
  name                text not null,
  neighbourhood       text not null,
  city                text not null default 'Barcelona',
  category            text not null,                        -- "bar", "club", etc.
  status              text not null default 'verified'
                       check (status in ('verified', 'verified_founding_50')),
  founding_50_number  int unique,                           -- nullable
  verified_since      date not null default current_date,
  pilot_started_at    date not null default current_date,
  created_at          timestamptz not null default now()
);

-- ─── venue_users — auth user ↔ venue mapping ────────────────────────────────
create table if not exists public.venue_users (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  venue_id   uuid not null references public.venues(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists venue_users_venue_id_idx on public.venue_users(venue_id);

-- ─── venue_metrics — output of the nightly aggregation cron ─────────────────
create table if not exists public.venue_metrics (
  venue_id     uuid not null references public.venues(id) on delete cascade,
  week_start   date not null,
  metric_key   text not null,                               -- 'check_ins' | 'tile_views' | 'tap_throughs' | 'peak_hours' | 'day_of_week' | 'neighbourhood_comparison'
  value        jsonb not null,                              -- the full data shape per @heat/contracts
  computed_at  timestamptz not null default now(),
  primary key (venue_id, week_start, metric_key)
);

create index if not exists venue_metrics_computed_at_idx on public.venue_metrics(computed_at desc);

-- ─── RLS — defence in depth alongside the API's JWT check ───────────────────
alter table public.venues        enable row level security;
alter table public.venue_users   enable row level security;
alter table public.venue_metrics enable row level security;

-- A venue can read its own row.
create policy "venue can read own venue row"
  on public.venues for select
  using (
    id = (select venue_id from public.venue_users where user_id = auth.uid())
  );

-- A venue can read its own user mapping.
create policy "user can read own venue_users row"
  on public.venue_users for select
  using (user_id = auth.uid());

-- A venue can read its own metrics. This is the second privacy layer required
-- by PRD §4.3 — even if the API has a bug, RLS prevents cross-tenant reads.
create policy "venue can read own metrics"
  on public.venue_metrics for select
  using (
    venue_id = (select venue_id from public.venue_users where user_id = auth.uid())
  );
