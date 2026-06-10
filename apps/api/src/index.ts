import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { venueRouter } from './routes/venue';
import { publicRouter } from './routes/public';
import { adminRouter } from './routes/admin';

const app = new Hono();

app.use(
  '*',
  cors({
    origin: (origin) => {
      const allowed = [
        'http://localhost:9000',
        'http://localhost:9001',
        'https://venues.getheatapp.com',
        'https://intelligence.getheatapp.com',
      ];
      return allowed.includes(origin) ? origin : null;
    },
    credentials: true,
  })
);

app.get('/health', (c) => c.json({ ok: true, ts: new Date().toISOString() }));

app.route('/v1/venue', venueRouter);
app.route('/v1/public', publicRouter);
app.route('/v1/admin', adminRouter);

app.notFound((c) => c.json({ error: 'not_found' }, 404));
app.onError((err, c) => {
  // Lazy import to avoid a cycle if observability ever imports anything that loads index.
  import('./lib/observability').then(({ captureError }) =>
    captureError(err, { path: c.req.path, method: c.req.method })
  );
  return c.json({ error: 'internal_error' }, 500);
});

const port = Number(process.env.PORT ?? 8787);
console.log(`[api] listening on :${port}`);

export default { port, fetch: app.fetch };
