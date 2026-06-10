import { Hono } from 'hono';
import { getHeatIntelligenceAuth } from '../lib/better-auth';
import { adminSupabase } from '../lib/supabase';

/**
 * Claims / onboarding owned by heat-intelligence.
 *
 * All user creation (BetterAuth), claim requests, status, and review logic live here.
 * The sister repo (heat-app) only has discovery UI + thin proxies.
 */

export const claimsRouter = new Hono();

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Helper to clean strings (mirrors the old bridge helpers)
function cleanString(value: unknown, maxLength: number): string {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanOptionalString(value: unknown, maxLength: number): string | null {
  const cleaned = cleanString(value, maxLength);
  return cleaned || null;
}

function cleanStringArray(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => cleanString(item, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

type SubmitBody = {
  venueId?: unknown;
  ownerName?: unknown;
  ownerEmail?: unknown;
  ownerPhone?: unknown;
  ownerRole?: unknown;
  password?: unknown;
  website?: unknown;
  instagram?: unknown;
  requestedUpdates?: unknown;
  preferredDescription?: unknown;
  eventNotes?: unknown;
  hours?: unknown;
  languagePreferences?: unknown;
  photoUrls?: unknown;
};

/**
 * POST /v1/claims/submit
 * Public (rate-limit recommended in production) claim submission.
 * Creates the BetterAuth user + hi_venue_owner_profile + hi_venue_claim_request.
 * This is now the canonical place — heat-app marketing should call this instead of doing direct DB work.
 */
claimsRouter.post('/submit', async (c) => {
  const body = (await c.req.json().catch(() => null)) as SubmitBody | null;
  if (!body) return c.json({ error: 'Invalid JSON' }, 400);

  const venueId = cleanString(body.venueId, 80);
  const ownerName = cleanString(body.ownerName, 120);
  const ownerEmail = cleanString(body.ownerEmail, 160).toLowerCase();
  const ownerPhone = cleanString(body.ownerPhone, 60);
  const ownerRole = cleanString(body.ownerRole, 80);
  const password = cleanString(body.password, 200);

  if (!UUID_RE.test(venueId)) {
    return c.json({ error: 'Choose a venue from the search results' }, 400);
  }
  if (!ownerName) return c.json({ error: 'Name is required' }, 400);
  if (!EMAIL_RE.test(ownerEmail)) {
    return c.json({ error: 'Valid email is required' }, 400);
  }
  if (!ownerPhone) return c.json({ error: 'Phone number is required' }, 400);
  if (!ownerRole) return c.json({ error: 'Role is required' }, 400);
  if (password.length < 8) {
    return c.json({ error: 'Password must be at least 8 characters' }, 400);
  }

  const auth = getHeatIntelligenceAuth();

  // 1. Verify venue is claimable (using service role to read hi_venues)
  const supabase = adminSupabase();
  const { data: venue, error: venueErr } = await supabase
    .from('hi_venues')
    .select('id, name, full_address, claim_status')
    .eq('id', venueId)
    .eq('is_active', true)
    .single();

  if (venueErr || !venue) {
    return c.json({ error: 'Venue not found' }, 404);
  }
  if (venue.claim_status !== 'unclaimed') {
    return c.json(
      { error: 'This venue already has Heat Intelligence access. Sign in or contact Heat.' },
      409,
    );
  }

  // Check for existing active claim
  const { data: existingClaim } = await supabase
    .from('hi_venue_claim_requests')
    .select('id, status')
    .eq('venue_id', venueId)
    .in('status', ['pending_review', 'needs_info', 'approved'])
    .limit(1)
    .single();

  if (existingClaim) {
    return c.json(
      { error: 'This venue already has a claim in progress. Sign in or contact Heat.' },
      409,
    );
  }

  // 2. Create BetterAuth user (this is the intelligence-owned account creation)
  let userId = '';
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: ownerEmail,
        password,
        name: ownerName,
      },
    });
    userId = result.user.id;
  } catch {
    return c.json(
      { error: 'Could not create account. If this email already exists, sign in to continue.' },
      409,
    );
  }

  // 3. Insert profile + claim request (using service role)
  try {
    const { error: profileErr } = await supabase.from('hi_venue_owner_profiles').upsert(
      {
        user_id: userId,
        name: ownerName,
        phone: ownerPhone,
        role: ownerRole,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (profileErr) throw profileErr;

    const { data: claim, error: claimErr } = await supabase
      .from('hi_venue_claim_requests')
      .insert({
        venue_id: venueId,
        user_id: userId,
        venue_name_snapshot: venue.name ?? 'Unknown venue',
        venue_address_snapshot: venue.full_address,
        owner_name: ownerName,
        owner_email: ownerEmail,
        owner_phone: ownerPhone,
        owner_role: ownerRole,
        website: cleanOptionalString(body.website, 240),
        instagram: cleanOptionalString(body.instagram, 120),
        requested_updates: cleanOptionalString(body.requestedUpdates, 1000),
        preferred_description: cleanOptionalString(body.preferredDescription, 1400),
        event_notes: cleanOptionalString(body.eventNotes, 1000),
        hours: cleanOptionalString(body.hours, 1000),
        language_preferences: cleanStringArray(body.languagePreferences, 6, 40),
        photo_urls: cleanStringArray(body.photoUrls, 8, 500),
        status: 'pending_review',
      })
      .select('id, status')
      .single();

    if (claimErr || !claim) throw claimErr;

    return c.json({
      ok: true,
      claim: {
        id: claim.id,
        status: claim.status,
      },
    });
  } catch (err) {
    // Best effort cleanup of the partially created auth user
    try {
      // BetterAuth doesn't have a trivial delete user in the api surface we used;
      // for now we log and rely on manual cleanup or future admin tooling.
      console.error('[claims] failed after user creation, manual cleanup may be needed for user', userId);
    } catch {}
    return c.json({ error: 'Could not submit claim request' }, 500);
  }
});

/**
 * POST /v1/claims/status
 * Used by the consumer marketing "Heat Intelligence login" component.
 * Accepts email + password, verifies via BetterAuth, and returns the user's
 * access grants + pending claims from the hi_* tables.
 *
 * This keeps the discoverability UI in the consumer marketing while the
 * actual auth + data lives in intelligence.
 */
claimsRouter.post('/status', async (c) => {
  const body = (await c.req.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const email = cleanString(body.email, 160).toLowerCase();
  const password = cleanString(body.password, 200);

  if (!EMAIL_RE.test(email) || password.length < 8) {
    return c.json({ error: 'Invalid credentials' }, 401);
  }

  const auth = getHeatIntelligenceAuth();

  try {
    const sessionRes = await auth.api.signInEmail({
      body: { email, password },
    });

    if (!sessionRes?.user) {
      return c.json({ error: 'Invalid email or password' }, 401);
    }

    const userId = sessionRes.user.id;

    const supabase = adminSupabase();

    const [accessRes, claimsRes] = await Promise.all([
      supabase
        .from('hi_venue_owner_venue_access')
        .select(
          `
            venue_id,
            role,
            access_status,
            granted_at,
            hi_venues:venue_id (name, neighborhood, city)
          `,
        )
        .eq('user_id', userId)
        .eq('access_status', 'active')
        .order('granted_at', { ascending: false }),
      supabase
        .from('hi_venue_claim_requests')
        .select('id, venue_id, venue_name_snapshot, status, created_at, reviewed_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    return c.json({
      ok: true,
      user: {
        id: userId,
        email: sessionRes.user.email,
      },
      access: (accessRes.data ?? []).map((row: any) => ({
        venue_id: row.venue_id,
        role: row.role,
        access_status: row.access_status,
        granted_at: row.granted_at,
        locations: row.hi_venues,
      })),
      claims: claimsRes.data ?? [],
    });
  } catch {
    return c.json({ error: 'Could not load Heat Intelligence status' }, 500);
  }
});

/**
 * GET /v1/claims/venues?q=...
 * Public search for claimable venues (unclaimed + active in the hi_venues mirror).
 * This replaces the old direct hi_venues query from heat-app's marketing typeahead.
 * Intelligence now owns the list of claimable venues.
 *
 * Supports name/address/neighborhood/city fuzzy search or exact UUID.
 */
claimsRouter.get('/venues', async (c) => {
  const q = (c.req.query('q') || '').trim();
  if (q.length < 2) return c.json({ results: [] });

  const supabase = adminSupabase();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const like = `%${q.replace(/[%_]/g, ' ')}%`;

  let query = supabase
    .from('hi_venues')
    .select('id, name, full_address, neighborhood, city, image_url, claim_status')
    .eq('is_active', true)
    .eq('claim_status', 'unclaimed');

  if (UUID_RE.test(q)) {
    query = query.eq('id', q);
  } else {
    query = query.or(
      `name.ilike.${like},full_address.ilike.${like},neighborhood.ilike.${like},city.ilike.${like}`,
    );
  }

  const { data, error } = await query.order('name').limit(8);

  if (error) return c.json({ results: [] }, 500);

  return c.json({
    results: (data ?? []).map((venue: any) => ({
      id: venue.id,
      name: venue.name ?? 'Unknown venue',
      full_address: venue.full_address ?? null,
      neighborhood: venue.neighborhood ?? null,
      city: venue.city ?? null,
      image_url: venue.image_url ?? null,
      claim_status: venue.claim_status ?? 'unclaimed',
    })),
  });
});
