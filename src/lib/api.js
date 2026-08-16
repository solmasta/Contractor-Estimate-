const REQUEST_TIMEOUT_MS = 55000;

export async function analyzePhotos({ images, context, marketArea, pricingZip }) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let res;
  try {
    res = await fetch("/api/estimate-photo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images, context, marketArea, pricingZip }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error(
        "Analysis took too long and timed out. Try fewer photos or simpler additional context."
      );
    }
    throw new Error("Couldn't reach the server. Check your connection and try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  const rawBody = await res.text();
  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    if (res.status === 413) {
      throw new Error(
        "Photos are too large for this server to accept. Try fewer photos, or smaller/lower-resolution ones."
      );
    }
    if (res.status === 504) {
      throw new Error(
        "Analysis took too long and timed out on the server. Try fewer photos or simpler additional context."
      );
    }
    throw new Error(`Server error (status ${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}
