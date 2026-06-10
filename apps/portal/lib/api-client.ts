import { createSupabaseServerClient } from './supabase/server';
import { hasSupabaseEnv } from './supabase/env';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

// Server-side fetch wrapper. Pulls the Supabase access token from the user's
// session and forwards it to the Hono API as a Bearer header.
export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let token = 'dev:0019'; // local fallback when auth isn't configured
  if (hasSupabaseEnv()) {
    const supabase = await createSupabaseServerClient();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    token = session?.access_token ?? token;
  }

  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${token}`,
    },
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`API ${res.status} ${res.statusText} for ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}
