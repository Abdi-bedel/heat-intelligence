'use client';

import { useActionState, useState } from 'react';
import { loginAction, requestPasswordResetAction, type LoginState } from './actions';

export default function LoginPage({
  searchParams,
}: {
  // Next 15 typed route props model `searchParams` as Promise-based in generated types.
  // `any` keeps this client page compatible without altering runtime behavior.
  searchParams: any;
}) {
  const nextParam = searchParams?.next ?? '/';
  const resetParam = searchParams?.reset;
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {
    error: null,
  });
  const [resetSent, setResetSent] = useState(false);

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center justify-center p-6">
      <div className="w-full rounded-lg border-hairline border-border bg-bg-card p-9">
        <div className="mb-6 flex items-center gap-2">
          <span className="font-serif text-xl font-medium tracking-tight">Heat</span>
          <span className="rounded-[3px] border-hairline border-border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.16em] text-text-secondary">
            venues
          </span>
        </div>

        <h1 className="mb-2 font-serif text-3xl font-medium tracking-tight">Log in</h1>
        <p className="mb-6 text-sm text-text-secondary">
          Verified venue accounts only. Founders create your login during in-person verification.
        </p>

        {resetParam === 'sent' && (
          <div className="mb-4 rounded-md bg-teal-soft px-3 py-2 text-xs text-teal-text">
            If that email is on file, a reset link is on its way.
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-3">
          <input type="hidden" name="next" value={nextParam} />
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wider text-text-tertiary">
            Email
            <input
              type="email"
              name="email"
              required
              autoComplete="email"
              className="rounded-md border-hairline border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-text-primary"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-xs uppercase tracking-wider text-text-tertiary">
            Password
            <input
              type="password"
              name="password"
              required
              autoComplete="current-password"
              className="rounded-md border-hairline border-border bg-bg px-3 py-2.5 text-sm text-text-primary outline-none focus:border-text-primary"
            />
          </label>
          {state.error && <p className="text-xs text-coral">{state.error}</p>}
          <button
            type="submit"
            disabled={pending}
            className="mt-2 rounded-md bg-text-primary px-4 py-2.5 text-sm font-medium text-bg-card disabled:opacity-50"
          >
            {pending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <form
          action={async (fd) => {
            await requestPasswordResetAction(fd);
            setResetSent(true);
          }}
          className="mt-6 border-t-hairline border-border pt-4"
        >
          <p className="mb-2 text-xs text-text-secondary">Forgot your password?</p>
          <div className="flex gap-2">
            <input
              type="email"
              name="email"
              placeholder="you@venue.com"
              className="flex-1 rounded-md border-hairline border-border bg-bg px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="rounded-md border-hairline border-border bg-bg px-3 py-2 text-xs font-medium text-text-primary"
            >
              Send reset
            </button>
          </div>
          {resetSent && (
            <p className="mt-2 text-[11px] text-text-tertiary">
              If that email is on file, a reset link is on its way.
            </p>
          )}
        </form>
      </div>
    </main>
  );
}
