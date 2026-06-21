// Reference template only.
// Adapt this file based on the actual Hugging Face Space origin, headers, streaming behavior, and runtime requirements.
// Do not use blindly without checking the project files.
// This optional proxy is not the main backend.
// Do not hardcode secrets in this file.

const targetOrigin = Deno.env.get("TARGET_ORIGIN");

if (!targetOrigin) {
  throw new Error("TARGET_ORIGIN is required");
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
  "access-control-allow-headers": "*",
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(incomingUrl.pathname + incomingUrl.search, targetOrigin);
  const headers = new Headers(request.headers);
  headers.set("host", targetUrl.host);

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : request.body;

  const upstreamResponse = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  const responseHeaders = new Headers(upstreamResponse.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    responseHeaders.set(key, value);
  }

  return new Response(upstreamResponse.body, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
    headers: responseHeaders,
  });
});
