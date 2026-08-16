import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.join(__dirname, "dist");
const PORT = process.env.PORT || 3000;
const MAX_PHOTOS = 4;

const app = express();
app.use(express.json({ limit: "30mb" }));
app.use(express.static(DIST_DIR));

const client = new Anthropic({ apiKey: process.env.APP_SECRET });

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

app.post("/api/estimate-photo", async (req, res) => {
  try {
    const { images, context, marketArea, pricingZip } = req.body || {};

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: "At least one photo is required." });
    }
    if (images.length > MAX_PHOTOS) {
      return res.status(400).json({ error: `Please limit to ${MAX_PHOTOS} photos per request.` });
    }
    for (const img of images) {
      if (!img || typeof img.data !== "string" || typeof img.mediaType !== "string") {
        return res.status(400).json({ error: "Each photo must include base64 data and a media type." });
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
      model: "claude-opus-5",
      max_tokens: 4096,
      output_config: {
        effort: "high",
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

    let response = await client.messages.create({ ...requestParams, messages: [userMessage] });

    // The web search tool runs its own server-side loop with a default cap of
    // 10 iterations; if a lot of searching was needed, resume automatically
    // rather than returning a truncated mid-search response.
    let resumes = 0;
    while (response.stop_reason === "pause_turn" && resumes < 3) {
      response = await client.messages.create({
        ...requestParams,
        messages: [userMessage, { role: "assistant", content: response.content }],
      });
      resumes++;
    }

    if (response.stop_reason === "refusal") {
      return res.status(422).json({ error: "The AI declined to analyze these photos." });
    }

    const textBlocks = response.content.filter((block) => block.type === "text");
    const textBlock = textBlocks[textBlocks.length - 1];
    if (!textBlock) {
      return res.status(502).json({ error: "The AI did not return a usable response." });
    }

    const parsed = JSON.parse(textBlock.text);
    res.json(parsed);
  } catch (err) {
    console.error(err);
    const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
    res.status(status).json({ error: err.message || "Failed to analyze photo(s)." });
  }
});

app.listen(PORT, () => {
  console.log(`Contractor Estimate app running at http://localhost:${PORT}`);
  if (!process.env.APP_SECRET) {
    console.warn("Warning: APP_SECRET is not set. AI photo estimates will fail until it is configured.");
  }
  if (!fs.existsSync(DIST_DIR)) {
    console.warn('Warning: no "dist" build found. Run `npm run build` first, or use `npm run dev` for local development.');
  }
});
