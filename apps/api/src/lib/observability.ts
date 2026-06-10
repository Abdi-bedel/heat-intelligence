// Lightweight observability — no Sentry SDK dep yet (saves install footprint).
// Posts errors and cron results to a Slack webhook + a Sentry minimal-capture endpoint.
//
// Wire the real @sentry/bun SDK in Sprint 2A if richer tracing is needed.

const SLACK_WEBHOOK_URL = () => process.env.SLACK_WEBHOOK_URL;
const SENTRY_DSN = () => process.env.SENTRY_DSN;

export async function notifyCronResult(args: {
  jobId: string;
  ok: boolean;
  message: string;
  errors?: string[];
}): Promise<void> {
  const url = SLACK_WEBHOOK_URL();
  if (!url) {
    console.log(`[cron-result] ${args.ok ? 'OK' : 'FAIL'} ${args.jobId}: ${args.message}`);
    return;
  }
  const text = [
    args.ok ? '✓' : '✗',
    `cron \`${args.jobId}\`:`,
    args.message,
    args.errors?.length ? '\n```' + args.errors.join('\n') + '```' : '',
  ].join(' ');

  await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  }).catch((err) => {
    console.error('[slack] webhook failed', err);
  });
}

export async function captureError(err: unknown, context?: Record<string, unknown>): Promise<void> {
  console.error('[error]', err, context);
  const dsn = SENTRY_DSN();
  if (!dsn) return;
  // Minimal Sentry envelope. Real SDK does sampling + breadcrumbs;
  // this is good enough for "alert me when something explodes."
  try {
    const url = new URL(dsn);
    const projectId = url.pathname.replace('/', '');
    const publicKey = url.username;
    const host = url.host;
    const ingest = `https://${host}/api/${projectId}/store/?sentry_version=7&sentry_key=${publicKey}`;
    await fetch(ingest, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        message: err instanceof Error ? err.message : String(err),
        level: 'error',
        platform: 'javascript',
        timestamp: Date.now() / 1000,
        extra: context,
      }),
    });
  } catch (e) {
    console.error('[sentry] capture failed', e);
  }
}
