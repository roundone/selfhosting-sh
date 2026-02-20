interface Env {
  RESEND_API_KEY: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://selfhosting.sh',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function jsonResponse(data: object, status: number) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export const onRequestOptions: PagesFunction<Env> = async () => {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const { request, env } = context;

  if (!env.RESEND_API_KEY) {
    return jsonResponse({ error: 'Server configuration error' }, 500);
  }

  let email: string;

  const contentType = request.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    const body = await request.json() as { email?: string };
    email = (body.email || '').trim().toLowerCase();
  } else if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    email = (formData.get('email') as string || '').trim().toLowerCase();
  } else {
    return jsonResponse({ error: 'Invalid content type' }, 400);
  }

  if (!email || !isValidEmail(email)) {
    return jsonResponse({ error: 'Please enter a valid email address.' }, 400);
  }

  // Create contact in Resend
  const res = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      unsubscribed: false,
    }),
  });

  if (res.ok) {
    // Check if request was a form submission (non-JS) or fetch (JS)
    const accept = request.headers.get('accept') || '';
    if (accept.includes('application/json')) {
      return jsonResponse({ success: true, message: 'Subscribed! Check your inbox.' }, 200);
    }
    // Form submission — redirect to thank-you page
    return Response.redirect('https://selfhosting.sh/subscribed/', 303);
  }

  // Handle Resend errors
  const errorBody = await res.text();
  let errorMessage = 'Something went wrong. Please try again.';

  if (res.status === 422) {
    // Likely duplicate or invalid email on Resend's side
    // Resend actually returns 200 for duplicates (idempotent), so 422 means truly invalid
    errorMessage = 'This email address could not be added. Please check and try again.';
  }

  if (res.status === 429) {
    errorMessage = 'Too many requests. Please try again in a moment.';
  }

  const accept = request.headers.get('accept') || '';
  if (accept.includes('application/json')) {
    return jsonResponse({ error: errorMessage }, res.status >= 500 ? 500 : 400);
  }
  return Response.redirect(`https://selfhosting.sh/subscribed/?error=${encodeURIComponent(errorMessage)}`, 303);
};
