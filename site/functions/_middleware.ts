// Cloudflare Pages Middleware: redirect www.selfhosting.sh → selfhosting.sh (301)
// This runs before all Pages Functions and static asset serving.

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);

  // 301 redirect www to apex domain, preserving path and query string
  if (url.hostname === 'www.selfhosting.sh') {
    url.hostname = 'selfhosting.sh';
    return new Response(null, {
      status: 301,
      headers: {
        'Location': url.toString(),
      },
    });
  }

  // For all other requests, continue to the next handler
  return context.next();
};
