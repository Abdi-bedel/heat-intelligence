'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');
  const next = String(formData.get('next') ?? '/');

  if (!email || !password) {
    return { error: 'Email and password required.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Anti-enumeration: same generic message for bad email vs. bad password.
    return { error: 'Email or password is incorrect.' };
  }

  redirect(next);
}

export async function requestPasswordResetAction(formData: FormData): Promise<{ ok: true }> {
  const email = String(formData.get('email') ?? '').trim();
  if (!email) return { ok: true }; // anti-enumeration: same response shape regardless

  const supabase = await createSupabaseServerClient();
  const portalUrl = process.env.NEXT_PUBLIC_PORTAL_URL ?? 'http://localhost:9000';
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${portalUrl}/auth/reset`,
  });
  return { ok: true };
}
