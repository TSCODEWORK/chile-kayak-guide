// Cloudflare Pages Function: /api/health
// Edge Healthcheck

export async function onRequest() {
  return new Response(JSON.stringify({
    status: 'ok',
    app: 'Chile Whitewater Kayaking Guide',
    partner: 'David Hughes · Pucon Kayak Retreat (PKR)',
    telemetry: 'ChileWaterLevels.com',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
