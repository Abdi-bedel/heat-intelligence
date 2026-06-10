import type { Context, Next } from 'hono';
import { createMiddleware } from 'hono/factory';
import { jwtVerify } from 'jose';
import { adminSupabase } from './lib/supabase';

// Supabase Auth — verify JWT locally with jose, then look up venue_id.
//
// Two paths:
//   - Real: `Authorization: Bearer <supabase-jwt>` → jose verify → venue_users lookup
//   - Dev:  `Authorization: Bearer dev:<short_id>` → bypass, set deterministic ctx.
//           Hard-rejected when NODE_ENV === 'production'.

export type AuthContext = {
  venue_id: string;
  user_id: string;
  user_email: string;
};

declare module 'hono' {
  interface ContextVariableMap {
    auth: AuthContext;
  }
}

const isProd = () => process.env.NODE_ENV === 'production';

let cachedSecret: Uint8Array | null = null;
function jwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.SUPABASE_JWT_SECRET;
  if (!raw) throw new Error('SUPABASE_JWT_SECRET missing');
  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

async function verifyAndResolve(token: string): Promise<AuthContext | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    const userId = payload.sub;
    const userEmail = (payload.email as string | undefined) ?? '';
    if (!userId) return null;

    const { data, error } = await adminSupabase()
      .from('venue_users')
      .select('venue_id')
      .eq('user_id', userId)
      .single();
    if (error || !data) return null;

    return {
      venue_id: data.venue_id as string,
      user_id: userId,
      user_email: userEmail,
    };
  } catch {
    return null;
  }
}

export const requireVenueAuth = createMiddleware(async (c: Context, next: Next) => {
  const header = c.req.header('Authorization');
  if (!header?.startsWith('Bearer ')) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  const token = header.slice('Bearer '.length);

  if (token.startsWith('dev:')) {
    if (isProd()) return c.json({ error: 'unauthorized' }, 401);
    const short = token.slice('dev:'.length) || '0019';
    c.set('auth', {
      venue_id: `ven_dev_${short}`,
      user_id: `usr_dev_${short}`,
      user_email: 'marsella@example.com',
    });
    return next();
  }

  const ctx = await verifyAndResolve(token);
  if (!ctx) return c.json({ error: 'unauthorized' }, 401);
  c.set('auth', ctx);
  return next();
});
