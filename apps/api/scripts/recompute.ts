#!/usr/bin/env bun
// Manual cron trigger — for testing the aggregation pipeline locally and for
// founder-driven force-refreshes before sales calls.
//
// Usage:
//   bun run apps/api/scripts/recompute.ts                # all venues, 8 weeks
//   bun run apps/api/scripts/recompute.ts --venues abc,def --weeks 4

import { recomputeMetrics } from '../src/cron/recompute';

function parseArgs() {
  const out: { venue_ids?: string[]; weeks_back?: number } = {};
  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--venues' && process.argv[i + 1]) {
      out.venue_ids = process.argv[i + 1]!.split(',');
      i++;
    } else if (process.argv[i] === '--weeks' && process.argv[i + 1]) {
      out.weeks_back = Number(process.argv[i + 1]);
      i++;
    }
  }
  return out;
}

const result = await recomputeMetrics(parseArgs());
console.log('');
console.log(`job_id:                ${result.jobId}`);
console.log(`venues processed:      ${result.venuesProcessed}/${result.venuesQueued}`);
console.log(`estimated wallclock:   ~${result.estimatedCompletionSeconds}s`);
if (result.errors.length) {
  console.log(`errors (${result.errors.length}):`);
  for (const e of result.errors) console.log(`  ${e}`);
  process.exit(1);
}
