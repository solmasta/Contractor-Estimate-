import { estimatePhoto } from "../../server/estimatePhoto.js";

// Cloudflare Pages Functions run on the Workers runtime (fetch Request/Response,
// not Express req/res). Requires the "nodejs_compat" compatibility flag (set in
// wrangler.toml) for `process` to exist at all — estimatePhoto() reads
// process.env.APP_SECRET, so mirror the Pages env binding onto it explicitly
// rather than relying on that flag's automatic process.env sync.
export async function onRequestPost(context) {
  if (context.env?.APP_SECRET) {
    process.env.APP_SECRET = context.env.APP_SECRET;
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
