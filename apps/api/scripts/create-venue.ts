#!/usr/bin/env bun
// Founder admin CLI — create a venue + login during in-person verification (PRD §3.8).
//
// Usage:
//   bun run apps/api/scripts/create-venue.ts \
//     --name "Bar Marsella" \
//     --neighbourhood "El Born" \
//     --category bar \
//     --email marsella@example.com \
//     --founding-50 19
//
// Behaviour:
//   1. Creates the Supabase auth user with a generated password.
//   2. Triggers a password-reset email so the venue sets their own password on first login.
//   3. Inserts the venue row.
//   4. Inserts the venue_users mapping.
//   5. Prints the resulting venue_id for the founder's records.

import { adminSupabase } from '../src/lib/supabase';

type Args = {
  name?: string;
  neighbourhood?: string;
  category?: string;
  email?: string;
  shortId?: string;
  founding50?: number;
  city?: string;
};

function parseArgs(): Args {
  const args: Args = { city: 'Barcelona' };
  for (let i = 2; i < process.argv.length; i++) {
    const flag = process.argv[i];
    const val = process.argv[i + 1];
    switch (flag) {
      case '--name':          args.name = val; i++; break;
      case '--neighbourhood': args.neighbourhood = val; i++; break;
      case '--category':      args.category = val; i++; break;
      case '--email':         args.email = val; i++; break;
      case '--short-id':      args.shortId = val; i++; break;
      case '--founding-50':   args.founding50 = Number(val); i++; break;
      case '--city':          args.city = val; i++; break;
    }
  }
  return args;
}

function generatePassword(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

async function main() {
  const args = parseArgs();
  const required = ['name', 'neighbourhood', 'category', 'email'] as const;
  for (const k of required) {
    if (!args[k]) {
      console.error(`Missing --${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}`);
      process.exit(1);
    }
  }

  const sb = adminSupabase();

  console.log(`[create-venue] Creating Supabase auth user ${args.email}…`);
  const { data: userData, error: userErr } = await sb.auth.admin.createUser({
    email: args.email!,
    password: generatePassword(),
    email_confirm: true,
  });
  if (userErr || !userData.user) throw new Error(`auth.admin.createUser failed: ${userErr?.message}`);
  const userId = userData.user.id;

  // Auto-assign a 4-digit short id from the next sequence value if not provided.
  let shortId = args.shortId;
  if (!shortId) {
    const { count } = await sb.from('venues').select('id', { count: 'exact', head: true });
    shortId = String((count ?? 0) + 1).padStart(4, '0');
  }

  console.log(`[create-venue] Inserting venue row (display_short_id=${shortId})…`);
  const { data: venueData, error: venueErr } = await sb
    .from('venues')
    .insert({
      display_short_id: shortId,
      name: args.name,
      neighbourhood: args.neighbourhood,
      city: args.city,
      category: args.category,
      status: args.founding50 != null ? 'verified_founding_50' : 'verified',
      founding_50_number: args.founding50 ?? null,
    })
    .select('id')
    .single();
  if (venueErr || !venueData) throw new Error(`venues insert failed: ${venueErr?.message}`);

  console.log(`[create-venue] Mapping user → venue…`);
  const { error: mapErr } = await sb
    .from('venue_users')
    .insert({ user_id: userId, venue_id: venueData.id });
  if (mapErr) throw new Error(`venue_users insert failed: ${mapErr.message}`);

  console.log(`[create-venue] Sending password-reset link…`);
  const portalUrl = process.env.PORTAL_URL ?? 'http://localhost:9000';
  const { error: resetErr } = await sb.auth.admin.generateLink({
    type: 'recovery',
    email: args.email!,
    options: { redirectTo: `${portalUrl}/auth/reset` },
  });
  if (resetErr) console.warn(`[create-venue] reset link failed: ${resetErr.message}`);

  console.log('');
  console.log('✓ Venue created');
  console.log(`  venue_id:         ${venueData.id}`);
  console.log(`  display_short_id: ${shortId}`);
  console.log(`  email:            ${args.email}`);
  console.log(`  founding_50:      ${args.founding50 ?? 'no'}`);
  console.log('');
  console.log('Password-reset email sent. Venue sets their own password on first login.');
}

main().catch((err) => {
  console.error('[create-venue] FAILED', err);
  process.exit(1);
});
