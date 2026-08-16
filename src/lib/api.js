export async function analyzePhotos({ images, context, marketArea, pricingZip }) {
  const res = await fetch("/api/estimate-photo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images, context, marketArea, pricingZip }),
  });

  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload.error || "Request failed");
  }
  return payload;
}
