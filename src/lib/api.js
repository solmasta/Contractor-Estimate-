export async function analyzePhotos({ images, context, marketArea, pricingZip }) {
  const res = await fetch("/api/estimate-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, context, marketArea, pricingZip }),
  });

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
    throw new Error(`Server error (status ${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}
