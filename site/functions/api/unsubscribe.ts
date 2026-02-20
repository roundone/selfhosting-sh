interface Env {
  RESEND_API_KEY: string;
}

function htmlResponse(html: string, status: number = 200) {
  return new Response(html, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function unsubscribePage(message: string, isError: boolean = false) {
  const color = isError ? '#ef4444' : '#22c55e';
  const icon = isError ? '&#10007;' : '&#10003;';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribe | selfhosting.sh</title>
  <style>
    body { background: #0f1117; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #1a1d27; border: 1px solid #2a2d37; border-radius: 12px; padding: 48px; max-width: 480px; text-align: center; }
    .icon { font-size: 48px; color: ${color}; margin-bottom: 16px; }
    h1 { font-size: 20px; margin: 0 0 12px 0; }
    p { color: #a0a0a0; margin: 0 0 24px 0; line-height: 1.6; }
    a { color: #22c55e; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <h1>${isError ? 'Something went wrong' : 'Unsubscribed'}</h1>
    <p>${message}</p>
    <a href="https://selfhosting.sh">Back to selfhosting.sh</a>
  </div>
</body>
</html>`;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const { request, env } = context;
  const url = new URL(request.url);
  const email = (url.searchParams.get('email') || '').trim().toLowerCase();

  if (!env.RESEND_API_KEY) {
    return htmlResponse(unsubscribePage('Server configuration error. Please try again later.', true), 500);
  }

  if (!email) {
    return htmlResponse(unsubscribePage('No email address provided. Please use the unsubscribe link from your email.', true), 400);
  }

  // Update contact in Resend to unsubscribed
  const res = await fetch(`https://api.resend.com/contacts/${encodeURIComponent(email)}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ unsubscribed: true }),
  });

  if (res.ok) {
    return htmlResponse(unsubscribePage(
      "You've been unsubscribed from the selfhosting.sh newsletter. You won't receive any more emails from us."
    ));
  }

  if (res.status === 404) {
    // Contact not found — still show success (don't leak whether email exists)
    return htmlResponse(unsubscribePage(
      "You've been unsubscribed. You won't receive any more emails from us."
    ));
  }

  return htmlResponse(unsubscribePage(
    'We couldn\'t process your unsubscribe request. Please try again or email admin@selfhosting.sh for help.',
    true
  ), 500);
};
