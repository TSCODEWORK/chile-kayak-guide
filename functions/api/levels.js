import { HUBS, readingsFromPayloads } from '../../src/levels.js';

// Set LEVELS_API_BASE to the Chile River API origin (no trailing path) to
// read /v1/now instead of the public hub endpoints. LEVELS_API_KEY is sent
// as a Bearer token only when that origin is set. Neither value is committed.
const V1_PATH = '/v1/now';

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cacheKey = new Request(new URL('/api/levels', url.origin).toString(), { method: 'GET' });

  try {
    const cache = caches.default;
    const hit = await cache.match(cacheKey);
    if (hit) return hit;
  } catch {
    /* caches.default is unavailable outside the edge runtime */
  }

  const body = (env.LEVELS_API_BASE || '').trim()
    ? await readV1(env.LEVELS_API_BASE, env.LEVELS_API_KEY)
    : await readHubs();

  const response = new Response(JSON.stringify(body), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=120',
      'Access-Control-Allow-Origin': '*'
    }
  });

  try {
    context.waitUntil?.(caches.default.put(cacheKey, response.clone()));
  } catch {
    /* ignore cache write failures */
  }
  return response;
}

async function readHubs() {
  const payloads = {};
  await Promise.all(Object.entries(HUBS).map(async ([name, endpoint]) => {
    try {
      const res = await fetch(endpoint, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ChileWhitewaterKayakGuide'
        }
      });
      payloads[name] = res.ok ? await res.json() : null;
    } catch {
      payloads[name] = null;
    }
  }));
  return {
    source: 'hubs',
    fetchedAt: new Date().toISOString(),
    readings: readingsFromPayloads(payloads, Date.now())
  };
}

async function readV1(base, key) {
  const endpoint = `${base.replace(/\/$/, '')}${V1_PATH}`;
  const headers = { Accept: 'application/json' };
  if (key) headers.Authorization = `Bearer ${key}`;
  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    return { source: 'v1', fetchedAt: new Date().toISOString(), readings: [], error: `upstream ${res.status}` };
  }
  const data = await res.json();
  return {
    source: 'v1',
    fetchedAt: data.fetchedAt || new Date().toISOString(),
    readings: Array.isArray(data.readings) ? data.readings : []
  };
}
