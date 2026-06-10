-- Heat Intelligence claim/auth application tables for Neon/Postgres.
--
-- Run BetterAuth's own schema migration first:
--   psql "$HEAT_INTELLIGENCE_DATABASE_URL" -f marketing/better-auth-schema.sql
--
-- Then run this file:
--   psql "$HEAT_INTELLIGENCE_DATABASE_URL" -f marketing/db/20260607_heat_intelligence_neon.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS hi_venues (
  id            uuid PRIMARY KEY,
  name          text NOT NULL,
  full_address  text,
  neighborhood  text,
  city          text,
  latitude      numeric,
  longitude     numeric,
  image_url     text,
  claim_status  text NOT NULL DEFAULT 'unclaimed'
                CHECK (claim_status IN ('unclaimed', 'claimed', 'verified')),
  is_active     boolean NOT NULL DEFAULT true,
  source        text NOT NULL DEFAULT 'mirror',
  source_updated_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE hi_venues
  ADD COLUMN IF NOT EXISTS latitude numeric,
  ADD COLUMN IF NOT EXISTS longitude numeric,
  ADD COLUMN IF NOT EXISTS source_updated_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_hi_venues_active_name
  ON hi_venues (is_active, name);

CREATE INDEX IF NOT EXISTS idx_hi_venues_claim_status
  ON hi_venues (claim_status)
  WHERE claim_status <> 'unclaimed';

CREATE TABLE IF NOT EXISTS hi_venue_owner_profiles (
  user_id     text PRIMARY KEY,
  name        text NOT NULL,
  phone       text NOT NULL,
  role        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hi_venue_claim_requests (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id               uuid NOT NULL REFERENCES hi_venues(id) ON DELETE CASCADE,
  user_id                text NOT NULL,
  venue_name_snapshot    text NOT NULL,
  venue_address_snapshot text,
  owner_name             text NOT NULL,
  owner_email            text NOT NULL,
  owner_phone            text NOT NULL,
  owner_role             text NOT NULL,
  website                text,
  instagram              text,
  requested_updates      text,
  preferred_description  text,
  event_notes            text,
  hours                  text,
  language_preferences   text[] NOT NULL DEFAULT '{}',
  photo_urls             text[] NOT NULL DEFAULT '{}',
  status                 text NOT NULL DEFAULT 'pending_review'
                         CHECK (status IN ('pending_review', 'needs_info', 'approved', 'rejected')),
  reviewed_by            text,
  reviewed_at            timestamptz,
  admin_notes            text,
  created_at             timestamptz NOT NULL DEFAULT now(),
  updated_at             timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hi_venue_claim_requests_status_created
  ON hi_venue_claim_requests (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hi_venue_claim_requests_venue
  ON hi_venue_claim_requests (venue_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_hi_venue_claim_requests_user
  ON hi_venue_claim_requests (user_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hi_venue_claim_requests_one_active_per_venue
  ON hi_venue_claim_requests (venue_id)
  WHERE status IN ('pending_review', 'needs_info', 'approved');

CREATE TABLE IF NOT EXISTS hi_venue_owner_venue_access (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           text NOT NULL,
  venue_id          uuid NOT NULL REFERENCES hi_venues(id) ON DELETE CASCADE,
  claim_request_id  uuid REFERENCES hi_venue_claim_requests(id) ON DELETE SET NULL,
  role              text NOT NULL DEFAULT 'owner',
  access_status     text NOT NULL DEFAULT 'active'
                    CHECK (access_status IN ('active', 'revoked')),
  granted_by        text,
  granted_at        timestamptz NOT NULL DEFAULT now(),
  revoked_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_hi_venue_owner_venue_access_active_unique
  ON hi_venue_owner_venue_access (user_id, venue_id)
  WHERE access_status = 'active';
