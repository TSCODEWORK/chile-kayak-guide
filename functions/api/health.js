// Cloudflare Pages Function: /api/health
// Edge Healthcheck

export async function onRequest() {
  return new Response(JSON.stringify({
    status: 'ok',
    app: 'Chile Whitewater Kayak Guide',
    partner: 'Pucón Kayak Retreat (PKR)',
    telemetry: 'Chile Water Levels',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
