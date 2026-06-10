import { Hono } from 'hono';
import { requireVenueAuth } from '../auth';
import {
  getCheckIns,
  getDayOfWeek,
  getNeighbourhood,
  getPeakHours,
  getProfile,
  getTapThroughs,
  getTileViews,
} from '../lib/metrics-store';

export const venueRouter = new Hono();

venueRouter.use('*', requireVenueAuth);

venueRouter.get('/me/profile', async (c) => {
  const auth = c.get('auth');
  const profile = await getProfile(auth.venue_id);
  return c.json({ ...profile, user_email: auth.user_email || profile.user_email });
});

venueRouter.get('/me/metrics/check-ins', async (c) => {
  const auth = c.get('auth');
  return c.json(await getCheckIns(auth.venue_id, c.req.query('scenario')));
});

venueRouter.get('/me/metrics/peak-hours', async (c) => {
  const auth = c.get('auth');
  return c.json(await getPeakHours(auth.venue_id, c.req.query('scenario')));
});

venueRouter.get('/me/metrics/day-of-week', async (c) => {
  const auth = c.get('auth');
  return c.json(await getDayOfWeek(auth.venue_id, c.req.query('scenario')));
});

venueRouter.get('/me/metrics/neighbourhood-comparison', async (c) => {
  const auth = c.get('auth');
  return c.json(await getNeighbourhood(auth.venue_id, c.req.query('scenario')));
});

venueRouter.get('/me/metrics/tile-views', async (c) => {
  const auth = c.get('auth');
  return c.json(await getTileViews(auth.venue_id, c.req.query('scenario')));
});

venueRouter.get('/me/metrics/tap-throughs', async (c) => {
  const auth = c.get('auth');
  return c.json(await getTapThroughs(auth.venue_id, c.req.query('scenario')));
});
