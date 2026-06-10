import type { Founding50StatusResponse, LiveCountsResponse } from '@heat/contracts';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8787';

export async function fetchLiveCounts(): Promise<LiveCountsResponse> {
  const res = await fetch(`${API_BASE}/v1/public/live-counts`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`live-counts ${res.status}`);
  return res.json();
}

export async function fetchFounding50(): Promise<Founding50StatusResponse> {
  const res = await fetch(`${API_BASE}/v1/public/founding-50-status`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`founding-50-status ${res.status}`);
  return res.json();
}
