import Anthropic from "@anthropic-ai/sdk";

export const MAX_PHOTOS = 4;

const ESTIMATE_SCHEMA = {
  type: "object",
  properties: {
    summary: {
      type: "string",
      description: "One or two sentence summary of the work visible in the photo(s).",
    },
    labor: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          hours: { type: "number" },
          rate: { type: "number" },
        },
        required: ["description", "hours", "rate"],
        additionalProperties: false,
      },
    },
    materials: {
      type: "array",
      items: {
        type: "object",
        properties: {
          description: { type: "string" },
          qty: { type: "number" },
          unitCost: { type: "number" },
          source: {
            type: "string",
            description: "Where the price came from, e.g. 'Home Depot', 'Menards', or 'estimated' if no real listing was found.",
          },
        },
        required: ["description", "qty", "unitCost", "source"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "labor", "materials"],
  additionalProperties: false,
};

let client;
function getClient() {
  if (!client) {
    client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return client;
}

// Shared core logic used by both the local/Codespaces Express server
// (server.js) and the Vercel serverless function (api/estimate-photo.js).
// Framework-agnostic: takes a parsed request body, returns { status, body }.
export async function estimatePhoto(requestBody) {
  const { images, context, marketArea, pricingZip } = requestBody || {};

  if (!Array.isArray(images) || images.length === 0) {
    return { status: 400, body: { error: "At least one photo is required." } };
  }
  if (images.length > MAX_PHOTOS) {
    return { status: 400, body: { error: `Please limit to ${MAX_PHOTOS} photos per request.` } };
  }
  for (const img of images) {
    if (!img || typeof img.data !== "string" || typeof img.mediaType !== "string") {
      return { status: 400, body: { error: "Each photo must include base64 data and a media type." } };
    }
  }

  const imageBlocks = images.map((img) => ({
    type: "image",
    source: { type: "base64", media_type: img.mediaType, data: img.data },
  }));

  const promptText = [
    "You are helping a contractor prepare a job estimate from photos of a job site.",
    "Look at the photo(s) and identify the work that needs to be done.",
    "Suggest realistic labor line items (a short description, estimated hours, and a reasonable hourly rate in USD) and material line items (a short description and an estimated quantity needed).",
    marketArea
      ? `Price labor for the ${marketArea} market specifically - use current local rates for that area, not generic national averages.`
      : "",
    "For each material, use the web_search tool to look up its current price on homedepot.com or menards.com (prefer Home Depot when both carry it)" +
      (pricingZip ? `, near ZIP code ${pricingZip}.` : "."),
    "Use the real price you find as the material's unitCost, and set its `source` field to 'Home Depot' or 'Menards' accordingly. If a search turns up no specific matching product, use a reasonable estimate and set `source` to 'estimated'.",
    "Base your estimate on what is visibly needed. Keep line items concise and specific to what you see - do not invent work that isn't shown.",
    context ? `Additional context from the contractor: ${context}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const requestParams = {
    model: "claude-sonnet-5",
    max_tokens: 4096,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: ESTIMATE_SCHEMA },
    },
    tools: [
      {
        type: "web_search_20260209",
        name: "web_search",
        max_uses: 6,
        allowed_domains: ["homedepot.com", "menards.com"],
        ...(pricingZip
          ? { user_location: { type: "approximate", city: "Chicago", region: "Illinois", country: "US" } }
          : {}),
      },
    ],
  };
  const userMessage = {
    role: "user",
    content: [...imageBlocks, { type: "text", text: promptText }],
  };

  try {
    let response = await getClient().messages.create({ ...requestParams, messages: [userMessage] });

    // The web search tool runs its own server-side loop with a default cap of
    // 10 iterations; if a lot of searching was needed, resume automatically
    // rather than returning a truncated mid-search response.
    let resumes = 0;
    while (response.stop_reason === "pause_turn" && resumes < 1) {
      response = await getClient().messages.create({
        ...requestParams,
        messages: [userMessage, { role: "assistant", content: response.content }],
      });
      resumes++;
    }

    if (response.stop_reason === "refusal") {
      return { status: 422, body: { error: "The AI declined to analyze these photos." } };
    }

    const textBlocks = response.content.filter((block) => block.type === "text");
    const textBlock = textBlocks[textBlocks.length - 1];
    if (!textBlock) {
      return { status: 502, body: { error: "The AI did not return a usable response." } };
    }

    const parsed = JSON.parse(textBlock.text);
    return { status: 200, body: parsed };
  } catch (err) {
    console.error(err);
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
    return { status, body: { error: err.message || "Failed to analyze photo(s)." } };
  }
}
