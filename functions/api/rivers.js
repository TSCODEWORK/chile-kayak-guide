// Cloudflare Pages Function: /api/rivers
// Serverless edge API endpoint for Chile Whitewater Kayaking Guide

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const regionParam = url.searchParams.get('region');
  const classParam = url.searchParams.get('class');
  const searchParam = url.searchParams.get('search');

  // Fetch the static rivers JSON from the edge origin asset store
  const originUrl = new URL('/rivers.json', request.url);
  const res = await env.ASSETS.fetch(originUrl);
  if (!res.ok) {
    return new Response(JSON.stringify({ error: 'Failed to load rivers dataset' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const data = await res.json();
  let rivers = data.rivers || [];

  if (regionParam) {
    rivers = rivers.filter(r => r.regionId === regionParam);
  }

  if (classParam) {
    const clsNum = parseInt(classParam, 10);
    rivers = rivers.filter(r => r.classNumber === clsNum);
  }

  if (searchParam) {
    const q = searchParam.toLowerCase().trim();
    rivers = rivers.filter(r => 
      r.name.toLowerCase().includes(q) ||
      r.section.toLowerCase().includes(q) ||
      r.regionName.toLowerCase().includes(q)
    );
  }

  const payload = {
    count: rivers.length,
    total: (data.rivers || []).length,
    regions: data.regions,
    rivers: rivers,
    source: 'Chile Kayak Guide in collaboration with David Hughes (PKR)',
    telemetry: 'ChileWaterLevels.com'
  };

  return new Response(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=1800, stale-while-revalidate=86400'
    }
  });
}
