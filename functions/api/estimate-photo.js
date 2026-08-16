import { estimatePhoto } from "../../server/estimatePhoto.js";

// Cloudflare Pages Functions run on the Workers runtime (fetch Request/Response,
// not Express req/res). Requires the "nodejs_compat" compatibility flag (set in
// wrangler.toml) for `process` to exist at all — estimatePhoto() reads
// process.env.ANTHROPIC_API_KEY, so mirror the Pages env binding onto it explicitly
// rather than relying on that flag's automatic process.env sync.
export async function onRequestPost(context) {
  if (context.env?.ANTHROPIC_API_KEY) {
    process.env.ANTHROPIC_API_KEY = context.env.ANTHROPIC_API_KEY;
  }

  let requestBody;
  try {
    requestBody = await context.request.json();
  } catch {
    return jsonResponse(400, { error: "Invalid JSON body." });
  }

  const result = await estimatePhoto(requestBody);
  return jsonResponse(result.status, result.body);
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
