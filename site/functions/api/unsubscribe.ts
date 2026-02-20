// Cloudflare Pages Function: proxies unsubscribe requests to VPS portal
// The VPS portal handles subscriber storage and management

const VPS_UNSUBSCRIBE_URL = 'https://portal.selfhosting.sh/api/newsletter/unsubscribe';

export const onRequestGet: PagesFunction = async (context) => {
  const { request } = context;
  const url = new URL(request.url);
  const email = url.searchParams.get('email') || '';

  try {
    const res = await fetch(`${VPS_UNSUBSCRIBE_URL}?email=${encodeURIComponent(email)}`);
    const html = await res.text();
    return new Response(html, {
      status: res.status,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  } catch (err) {
    return new Response(
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Error | selfhosting.sh</title></head><body style="background:#0f1117;color:#e0e0e0;font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh"><div style="text-align:center"><p>Service temporarily unavailable. Please try again or email admin@selfhosting.sh</p><a href="https://selfhosting.sh" style="color:#22c55e">Back to selfhosting.sh</a></div></body></html>`,
      { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
    );
  }
};
