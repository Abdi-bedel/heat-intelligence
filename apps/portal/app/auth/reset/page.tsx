'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 12) {
      setError('Password must be at least 12 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    const supabase = createSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.replace('/');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full rounded-lg border-hairline border-border bg-bg-card p-9"
      >
        <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight">Set your password</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Pick something at least 12 characters. You&apos;ll use this to log in from now on.
        </p>
        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wider text-text-tertiary">
            New password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              className="rounded-md border-hairline border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wider text-text-tertiary">
            Confirm password
            <input
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              autoComplete="new-password"
              className="rounded-md border-hairline border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-text-primary"
            />
          </label>
          {error && <p className="text-xs text-coral">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="mt-2 rounded-md bg-text-primary px-4 py-2.5 text-sm font-medium text-bg-card disabled:opacity-50"
          >
            {submitting ? 'Saving…' : 'Save password'}
          </button>
        </div>
      </form>
    </main>
  );
}
