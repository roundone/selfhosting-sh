// Cloudflare Pages Function: proxies subscribe requests to VPS portal
// The VPS portal handles subscriber storage and management

const VPS_SUBSCRIBE_URL = 'https://portal.selfhosting.sh/api/newsletter/subscribe';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://selfhosting.sh',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction = async (context) => {
  const { request } = context;

  try {
    // Forward the request to the VPS portal
    const body = await request.text();
    const contentType = request.headers.get('content-type') || '';
    const accept = request.headers.get('accept') || '';

    const res = await fetch(VPS_SUBSCRIBE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': contentType,
        'Accept': accept,
      },
      body,
    });

    // For JSON responses, pass through directly
    if (accept.includes('application/json')) {
      const data = await res.text();
      return new Response(data, {
        status: res.status,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }

    // For form submissions, the VPS returns a redirect — follow it
    if (res.status === 303 || res.status === 302) {
      const location = res.headers.get('location') || 'https://selfhosting.sh/subscribed/';
      return Response.redirect(location, 303);
    }

    // Pass through any other response
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { 'Content-Type': res.headers.get('content-type') || 'text/plain', ...CORS_HEADERS },
    });
  } catch (err) {
    // If VPS is unreachable, return a graceful error
    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return new Response(JSON.stringify({ error: 'Service temporarily unavailable. Please try again.' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
      });
    }
    return Response.redirect('https://selfhosting.sh/subscribed/?error=Service+temporarily+unavailable', 303);
  }
};
